import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSocialLinks, useUpdateSocialLinks, SocialLinks } from '@/hooks/useSocialLinks';
import { Facebook, Instagram, Twitter, Youtube, Loader2 } from 'lucide-react';

const SocialLinksManager = () => {
  const { data: links, isLoading } = useSocialLinks();
  const updateMutation = useUpdateSocialLinks();
  const [form, setForm] = useState<SocialLinks>({
    facebook: '', instagram: '', tiktok: '', twitter: '', youtube: '',
  });

  useEffect(() => {
    if (links) setForm(links);
  }, [links]);

  const handleSave = () => updateMutation.mutate(form);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const fields = [
    { key: 'facebook' as const, label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/mcqsai' },
    { key: 'instagram' as const, label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/mcqsai' },
    { key: 'tiktok' as const, label: 'TikTok', icon: null, placeholder: 'https://tiktok.com/@mcqsai' },
    { key: 'twitter' as const, label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/mcqsai' },
    { key: 'youtube' as const, label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@mcqsai' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Links</CardTitle>
        <CardDescription>Add your social media profile URLs. They will appear in the website footer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <Label className="flex items-center gap-2">
              {Icon ? <Icon className="h-4 w-4" /> : <span className="text-sm">🎵</span>}
              {label}
            </Label>
            <Input
              value={form[key]}
              onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
            />
          </div>
        ))}
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
          {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Social Links
        </Button>
      </CardContent>
    </Card>
  );
};

export default SocialLinksManager;
