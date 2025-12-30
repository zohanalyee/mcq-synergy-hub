import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addEducationalSystem } from "@/services/lmsStructureService";
import { toast } from "sonner";

interface AddSystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddSystemDialog({ open, onOpenChange, onSuccess }: AddSystemDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<'academic' | 'job'>('academic');
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a system name");
      return;
    }

    setLoading(true);
    const result = await addEducationalSystem({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      is_active: isActive
    });
    setLoading(false);

    if (result) {
      toast.success(`System "${name}" created successfully`);
      resetForm();
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error("Failed to create system");
    }
  };

  const resetForm = () => {
    setName("");
    setType('academic');
    setDescription("");
    setIsActive(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Educational System</DialogTitle>
          <DialogDescription>
            Create a new educational system like a Board or Exam Type.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Sindh Board, Federal Board"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'academic' | 'job')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic (K-12, University)</SelectItem>
                <SelectItem value="job">Job Preparation (Competitive Exams)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create System"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
