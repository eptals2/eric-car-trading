import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Car = Tables<"cars">;
export type SortOption = "newest" | "price_asc" | "price_desc";

const ITEMS_PER_PAGE = 9;

export function useCars() {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading,setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [sort, setSort] = useState<SortOption>("price_asc");
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

    useEffect(() => {
        clearTimeout(debounceRef.current!);
        debounceRef.current = setTimeout(fetchCars, 600);
        return () => clearTimeout(debounceRef.current!);
    }, [page, sort, searchQuery]);

    async function fetchCars() {
        setLoading(true);

        const from = (page - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
            .from("cars")
            .select("*", { count: "exact"})
            .range(from, to);

        if (searchQuery.trim()) {
            query = query.ilike("name", `%${searchQuery.trim()}%`);
        }

        if (sort === "price_asc") query = query.order("price", { ascending: true });
        else if (sort === "price_desc") query = query.order("price", { ascending: false });
        else if (sort === "newest") query = query.order("created_at", { ascending: false });

        const { data, count, error } = await query;

        if (!error) {
            setCars(data ?? []);
            setTotalCount(count ?? 0);
        }
        setLoading(false);
    }

    function handleSearch(value: string) {
        setSearchQuery(value);
        setPage(1);
    }

    function handleSort(value: SortOption) {
        setSort(value);
        setPage(1);
    }

    return {
        cars, loading, totalCount, totalPages, 
        sort, page, searchQuery,
        setPage, handleSearch, handleSort
    };
}