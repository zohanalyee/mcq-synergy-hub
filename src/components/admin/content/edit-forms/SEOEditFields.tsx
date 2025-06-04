
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ContentItem } from "@/interfaces/content";

interface SEOEditFieldsProps {
  formData: Partial<ContentItem>;
  onChange: (field: keyof ContentItem, value: any) => void;
}

const SEOEditFields = ({ formData, onChange }: SEOEditFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="metaTitle">Meta Title</Label>
        <Input
          id="metaTitle"
          value={formData.metaTitle || ""}
          onChange={(e) => onChange('metaTitle', e.target.value)}
          placeholder="SEO meta title"
          maxLength={60}
        />
        <p className="text-xs text-muted-foreground">
          {(formData.metaTitle || "").length}/60 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaDescription">Meta Description</Label>
        <Textarea
          id="metaDescription"
          value={formData.metaDescription || ""}
          onChange={(e) => onChange('metaDescription', e.target.value)}
          placeholder="SEO meta description"
          maxLength={160}
          className="min-h-[80px]"
        />
        <p className="text-xs text-muted-foreground">
          {(formData.metaDescription || "").length}/160 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="metaKeywords">Meta Keywords</Label>
        <Input
          id="metaKeywords"
          value={formData.metaKeywords || ""}
          onChange={(e) => onChange('metaKeywords', e.target.value)}
          placeholder="Comma-separated keywords"
        />
        <p className="text-xs text-muted-foreground">
          Separate keywords with commas
        </p>
      </div>
    </div>
  );
};

export default SEOEditFields;
