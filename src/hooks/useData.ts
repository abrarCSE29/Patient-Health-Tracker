import { useState, useEffect } from "react";
import { authenticatedFetch } from "@/lib/apiClient";

export function useData<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!url) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await authenticatedFetch(url);
      if (!response.ok) throw new Error("Failed to fetch data");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refresh: fetchData };
}

export async function postData<T>(url: string, body: any): Promise<T> {
  const response = await authenticatedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => "No error body");
    throw new Error(`Failed to post data: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}
