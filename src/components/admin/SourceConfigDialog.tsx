import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";

interface SourceConfigDialogProps {
  source: {
    id: string;
    name: string;
    scraper_preference: string;
    needs_firecrawl: boolean;
    firecrawl_crawl_enabled: boolean;
    firecrawl_max_depth: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SourceConfigDialog = ({ source, open, onOpenChange, onSuccess }: SourceConfigDialogProps) => {
  const [config, setConfig] = useState({
    scraper_preference: source.scraper_preference || "auto",
    needs_firecrawl: source.needs_firecrawl || false,
    firecrawl_crawl_enabled: source.firecrawl_crawl_enabled || false,
    firecrawl_max_depth: source.firecrawl_max_depth || 2,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("scraping_sources")
      .update(config as any)
      .eq("id", source.id);
    setSaving(false);

    if (error) {
      toast.error("Failed to update config");
    } else {
      toast.success("Config updated");
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Settings2 className="h-4 w-4 text-blue-400" />
            Configure: {source.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Scraper Preference</Label>
            <Select
              value={config.scraper_preference}
              onValueChange={(v) => setConfig({ ...config, scraper_preference: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">⚡ Auto (Cheerio → Firecrawl)</SelectItem>
                <SelectItem value="cheerio">⚡ Cheerio Only (Free)</SelectItem>
                <SelectItem value="firecrawl">🔥 Firecrawl Only (Paid)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Auto tries Cheerio first, falls back to Firecrawl if needed
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Force Firecrawl</Label>
              <p className="text-[10px] text-muted-foreground">Skip Cheerio, use Firecrawl directly</p>
            </div>
            <Switch
              checked={config.needs_firecrawl}
              onCheckedChange={(v) => setConfig({ ...config, needs_firecrawl: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Enable Deep Crawling</Label>
              <p className="text-[10px] text-muted-foreground">Crawl sub-pages (e.g., /jobs, /news)</p>
            </div>
            <Switch
              checked={config.firecrawl_crawl_enabled}
              onCheckedChange={(v) => setConfig({ ...config, firecrawl_crawl_enabled: v })}
            />
          </div>

          {config.firecrawl_crawl_enabled && (
            <div className="space-y-1.5">
              <Label className="text-xs">Max Crawl Depth</Label>
              <Input
                type="number"
                min={1}
                max={5}
                className="h-8 text-xs w-20"
                value={config.firecrawl_max_depth}
                onChange={(e) =>
                  setConfig({ ...config, firecrawl_max_depth: parseInt(e.target.value) || 2 })
                }
              />
              <p className="text-[10px] text-muted-foreground">How many levels deep to crawl (1-5)</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Config"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SourceConfigDialog;
