import { defineRouteConfig } from "@medusajs/admin-sdk";
import React, { useEffect, useState } from "react";
import { Container, Heading, Button, Toaster, toast } from "@medusajs/ui";

const CacheVersionPage = () => {
  const [version, setVersion] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch current cache version on component mount
  const fetchCacheVersion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/admin/cache-version", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cache version");
      }

      const data = await response.json();
      setVersion(data.version);
    } catch (error) {
      console.error("Error fetching cache version:", error);
      toast.error("Failed to load cache version");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheVersion();
  }, []);

  // Handle cache version update
  const handleUpdateCache = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch("/admin/cache-version", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update cache version");
      }

      const data = await response.json();
      setVersion(data.version);
      toast.success(data.message || "Cache version updated successfully");
    } catch (error) {
      console.error("Error updating cache version:", error);
      toast.error("Failed to update cache version");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Container>
      <Toaster />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1">Cache Management</Heading>

        <div className="bg-ui-bg-base rounded-lg border border-ui-border-base p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <Heading level="h2" className="text-lg mb-2">
                Current Cache Version
              </Heading>
              <p className="text-ui-fg-subtle text-sm mb-4">
                The cache version is used to invalidate client-side caches when you need to force users to refresh their data.
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-ui-fg-subtle">Loading...</div>
              </div>
            ) : (
              <>
                <div className="bg-ui-bg-subtle rounded-md p-6 border border-ui-border-base">
                  <div className="text-center">
                    <div className="text-sm text-ui-fg-subtle mb-2">Version</div>
                    <div className="text-3xl font-bold text-ui-fg-base">{version}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleUpdateCache}
                    disabled={isUpdating}
                    variant="primary"
                    size="large"
                    className="w-full"
                  >
                    {isUpdating ? "Updating..." : "Update Cache"}
                  </Button>
                  <p className="text-xs text-ui-fg-subtle text-center">
                    Clicking this button will increment the cache version and force clients to refresh their cached data.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-ui-bg-subtle rounded-lg border border-ui-border-base p-6">
          <Heading level="h3" className="text-md mb-3">
            How it works
          </Heading>
          <ul className="list-disc list-inside space-y-2 text-sm text-ui-fg-subtle">
            <li>The cache version is stored on the backend and checked by the storefront</li>
            <li>When you update the cache, the version number is automatically incremented</li>
            <li>Clients will detect the version change and clear their local cache</li>
            <li>Use this when you've made changes that require users to see fresh data</li>
          </ul>
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Cache Version",
});

export default CacheVersionPage;
