import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addLevel } from "@/services/lmsStructureService";
import { toast } from "sonner";

interface AddLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemId: string;
  onSuccess: () => void;
}

export function AddLevelDialog({ open, onOpenChange, systemId, onSuccess }: AddLevelDialogProps) {
  const [name, setName] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a level name");
      return;
    }

    setLoading(true);
    const result = await addLevel(systemId, {
      name: name.trim(),
      order_index: orderIndex
    });
    setLoading(false);

    if (result) {
      toast.success(`Level "${name}" created successfully`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error("Failed to create level");
    }
  };

  const resetForm = () => {
    setName("");
    setOrderIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Level</DialogTitle>
          <DialogDescription>
            Create a new level like Class 9, Class 10, or General Recruitment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Level Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Class 9, SSC, General"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="order">Order Index</Label>
            <Input
              id="order"
              type="number"
              min={0}
              placeholder="0"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Used for sorting. Lower numbers appear first.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Level"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
