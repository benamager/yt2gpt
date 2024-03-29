import Mascot from "@components/Mascot";
import HomepageForm from "@components/HomepageForm";

export default function Page() {
    return (
        <main className="mt-[50px] flex flex-col-reverse items-center gap-9 lg:mt-[130px] lg:flex-row ">
            <div className="flex flex-col">
                <h1 className="mb-3 font-P2P text-2xl">Youtube To GPT</h1>
                <p className="mb-6">Unleash the power of YouTube videos. Get summaries, insights, fact-check and much more!</p>
                <HomepageForm />
            </div>
            <Mascot />
        </main>
    );
}
