"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PackageFormDialog } from "@/components/packages/package-form-dialog";
import { DestinationsManager, type DestinationRow } from "@/components/destinations/destinations-manager";

export function PackagesToolbar({ destinations }: { destinations: DestinationRow[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [manageDestinationsOpen, setManageDestinationsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setManageDestinationsOpen(true)}>
          <MapPin />
          Manage Destinations
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus />
          Add Package
        </Button>
      </div>
      <PackageFormDialog mode="create" open={addOpen} onOpenChange={setAddOpen} destinations={destinations} />
      <Dialog open={manageDestinationsOpen} onOpenChange={setManageDestinationsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Destinations</DialogTitle>
          </DialogHeader>
          <DestinationsManager destinations={destinations} />
        </DialogContent>
      </Dialog>
    </>
  );
}
