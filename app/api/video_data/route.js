import { get_encoding } from "@dqbd/tiktoken";
import generateRequest from "./generateRequest";

const innertube_regex = /"INNERTUBE_API_KEY":"([^"]+)"/;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("id");

  const youtubeRegex = /^[a-zA-Z0-9_-]{11}$/;
  if (!youtubeRegex.test(videoId)) {
    return Response.json({ error: "No valid video ID found" }, { status: 404 });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  // Fetch the initial video page and extract the INNERTUBE_KEY
  const response = await fetch(url);
  const videoPageBody = await response.text();

  const match = videoPageBody.match(innertube_regex);
  const INNERTUBE_KEY = match && match[1];

  // Make a POST request to get the transcript data
  const transcriptResponse = await fetch(`https://www.youtube.com/youtubei/v1/get_transcript?key=${INNERTUBE_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(generateRequest(videoPageBody, { lang: "en" })),
  });

  const body = await transcriptResponse.json();

  // transscripts is disabled, return
  if (!body.actions) {
    return Response.json({ error: "Transcript is disabled on this video..." }, { status: 404 });
  }

  // Extract the transcript data from the response
  const cueGroups = body.actions[0].updateEngagementPanelAction.content.transcriptRenderer.body.transcriptBodyRenderer.cueGroups;
  const transcriptsData = cueGroups.map((cueGroup) => {
    const cue = cueGroup.transcriptCueGroupRenderer.cues[0].transcriptCueRenderer;
    return {
      text: cue.cue.simpleText,
      duration: parseInt(cue.durationMs),
      offset: parseInt(cue.startOffsetMs),
    };
  });

  // Create a new array of just the transcript text
  const transcriptTexts = transcriptsData.map((transcript) => transcript.text);
  const transscript = transcriptTexts.join(" ");

  // encode the transscript to get token amount
  const enc = get_encoding("cl100k_base");
  const tokens = enc.encode(transscript);
  const maxTokens = 10000;
  // token count is too long throw error
  console.log("token length: " + tokens.length);
  if (tokens.length > maxTokens) {
    const excessPercent = ((tokens.length - maxTokens) / maxTokens) * 100;
    return Response.json({ error: `Video is too long by ${excessPercent.toFixed(2)}%.` }, { status: 422 });
  }

  // Extract the video data from the response
  const videoDetails = {
    title: "This would be the title of the video...",
  };

  return Response.json({ transscript, videoDetails }, { status: 200 });
}
