import { createClient } from "@supabase/supabase-js";

export type Car = {
    image: string | null;
    name: string;
    price: number;
    status: string | null;
    description: string | null;
};

export async function getCarDetails(
    supabaseUrl: string,
    supabaseKey: string,
    carId: string,
    limit: 10
): Promise<Car[]> {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from("cars")
        .select("image, name, price, status, description")
        .eq("id", carId)
        .limit(limit);

    if (error) {
        console.error("Error fetching car details:", error);
        return [];
    }

    return data ?? [];
}

export async function formatCarDetails(cars: Car[]): Promise<string> {
    if (cars.length === 0) return "No cars available.";

    return cars
        .map((car, i) => {
            const desc = car.description
                ? ` — ${String(car.description).slice(0, 120)}`
                : "";
            return `${i + 1}. ${car.image ? `![Image](${car.image})` : ""} ${car.name} — PHP ${car.price} (${car.status})${desc}`;
        })
        .join("\n");
}