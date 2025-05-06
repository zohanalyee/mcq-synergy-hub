
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { SyllabusItem } from "@/data/jobTestsData";

interface SyllabusItemFormProps {
  syllabusItems: SyllabusItem[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof SyllabusItem, value: string | number) => void;
}

const SyllabusItemForm = ({ syllabusItems, onAdd, onRemove, onChange }: SyllabusItemFormProps) => {
  return (
    <div className="grid gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Syllabus Items</label>
        <Button 
          type="button" 
          variant="outline"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>
      
      <div className="space-y-2">
        {syllabusItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="Topic (e.g., English)"
              value={item.topic}
              onChange={(e) => onChange(index, 'topic', e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="% (e.g., 20)"
              value={item.percentage === 0 ? '' : item.percentage}
              onChange={(e) => onChange(index, 'percentage', Number(e.target.value))}
              className="w-20"
              min="1"
              max="100"
            />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={() => onRemove(index)}
              disabled={syllabusItems.length === 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyllabusItemForm;
