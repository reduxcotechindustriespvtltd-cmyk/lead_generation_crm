"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageFormDialog } from "@/components/packages/package-form-dialog";

export function PackagesToolbar() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setAddOpen(true)}>
        <Plus />
        Add Package
      </Button>
      <PackageFormDialog mode="create" open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
