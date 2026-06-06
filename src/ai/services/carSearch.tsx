import { askGemini } from "../clients/gemini.client";
import { CAR_ASSISTANT_SYSTEM_PROMPT } from "../prompts/carAssistantPrompt.tsx";
import { getCarDetails, formatCarDetails } from "../tools/fetchInventory.tsx";

type CarSearchDependencies = {
    geminiApiKey: string;
    supabaseUrl: string;
    supabaseKey: string;
    model: "gemini-2.5-flash";
}

type CarSearchResult = {
    reply: string;
}

export async function searchCarsWithAi(
    query: string,
    dependencies: CarSearchDependencies
): Promise<CarSearchResult> {
    //1. Get inventory from DB
    const cars = await getCarDetails(dependencies.supabaseUrl, dependencies.supabaseKey, dependencies.geminiApiKey, 50);

    //2. Format inventory for AI
    const inventory = await formatCarDetails(cars);

    // 3. Ask AI
    const { reply } = await askGemini(dependencies.geminiApiKey, [
        { role: "system", content: CAR_ASSISTANT_SYSTEM_PROMPT },
        { role: "user", content: `Inventory:\n${inventory}\n\nCustomer question: ${query}` },
    ], dependencies.model);

    return { reply };
}