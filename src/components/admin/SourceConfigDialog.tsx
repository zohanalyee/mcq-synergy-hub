import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings2, Code } from "lucide-react";

interface SourceConfigDialogProps {
  source: {
    id: string;
    name: string;
    url: string;
    scraper_preference: string;
    needs_firecrawl: boolean;
    firecrawl_crawl_enabled: boolean;
    firecrawl_max_depth: number;
    custom_selectors?: any;
    notes?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SourceConfigDialog = ({ source, open, onOpenChange, onSuccess }: SourceConfigDialogProps) => {
  const [config, setConfig] = useState({
    name: source.name || "",
    url: source.url || "",
    scraper_preference: source.scraper_preference || "auto",
    needs_firecrawl: source.needs_firecrawl || false,
    firecrawl_crawl_enabled: source.firecrawl_crawl_enabled || false,
    firecrawl_max_depth: source.firecrawl_max_depth || 2,
    custom_selectors_json: JSON.stringify(source.custom_selectors || {}, null, 2),
    notes: source.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    let selectors = {};
    try {
      selectors = JSON.parse(config.custom_selectors_json);
    } catch {
      toast.error("Invalid JSON in custom selectors");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("scraping_sources")
      .update({
        name: config.name,
        url: config.url,
        scraper_preference: config.scraper_preference,
        needs_firecrawl: config.needs_firecrawl,
        firecrawl_crawl_enabled: config.firecrawl_crawl_enabled,
        firecrawl_max_depth: config.firecrawl_max_depth,
        custom_selectors: selectors,
        notes: config.notes,
      } as any)
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Settings2 className="h-4 w-4 text-blue-400" />
            Configure: {source.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Source Name</Label>
            <Input
              className="h-8 text-sm"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Source URL</Label>
            <Input
              className="h-8 text-sm"
              type="url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground">The main page to scrape</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Scraper Preference</Label>
            <Select
              value={config.scraper_preference}
              onValueChange={(v) => setConfig({ ...config, scraper_preference: v })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">⚡ Auto (Cheerio → Firecrawl)</SelectItem>
                <SelectItem value="cheerio">⚡ Cheerio Only (Free)</SelectItem>
                <SelectItem value="firecrawl">🔥 Firecrawl Only (Paid)</SelectItem>
              </SelectContent>
            </Select>
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
              <p className="text-[10px] text-muted-foreground">Crawl sub-pages</p>
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
                type="number" min={1} max={5}
                className="h-8 text-xs w-20"
                value={config.firecrawl_max_depth}
                onChange={(e) => setConfig({ ...config, firecrawl_max_depth: parseInt(e.target.value) || 2 })}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Code className="h-3 w-3" /> Custom CSS Selectors (JSON)
            </Label>
            <Textarea
              value={config.custom_selectors_json}
              onChange={(e) => setConfig({ ...config, custom_selectors_json: e.target.value })}
              rows={5}
              className="font-mono text-xs"
              placeholder={`{\n  "container": ".job-card",\n  "title": "h2.title"\n}`}
            />
            <p className="text-[10px] text-muted-foreground">
              CSS selectors for targeted scraping. Leave empty for auto-detection.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={config.notes}
              onChange={(e) => setConfig({ ...config, notes: e.target.value })}
              rows={2}
              className="text-xs"
              placeholder="Internal notes..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Config"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SourceConfigDialog;
