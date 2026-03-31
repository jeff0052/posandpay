import React, { useState, useRef } from "react";
import { X, Upload, Link, Image as ImageIcon, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { type MenuItem, modifierGroups } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";
import { useCategories } from "@/state/category-store";
import { compressImageToBase64, isValidImageUrl } from "@/lib/image-utils";
import { RecipeEditor } from "./RecipeEditor";

interface MenuItemDrawerProps {
  item: Partial<MenuItem> & { id?: string };
  isNew: boolean;
  onSave: (item: Partial<MenuItem>) => void;
  onClose: () => void;
}

export const MenuItemDrawer: React.FC<MenuItemDrawerProps> = ({ item, isNew, onSave, onClose }) => {
  const { t } = useLanguage();
  const categories = useCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(item.name || "");
  const [nameZh, setNameZh] = useState(item.nameZh || "");
  const [price, setPrice] = useState(String(item.price || ""));
  const [category, setCategory] = useState(item.category || categories[0]?.name || "");
  const [description, setDescription] = useState(item.description || "");
  const [image, setImage] = useState(item.image || "");
  const [available, setAvailable] = useState(item.available ?? true);
  const [popular, setPopular] = useState(item.popular ?? false);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>(item.modifierGroups || []);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageToBase64(file);
      setImage(base64);
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };

  const handleUrlSubmit = () => {
    if (isValidImageUrl(urlInput)) {
      setImage(urlInput);
      setShowUrlInput(false);
      setUrlInput("");
    }
  };

  const handleSave = () => {
    if (!name.trim() || !price) return;
    onSave({
      ...item,
      name: name.trim(),
      nameZh: nameZh.trim() || undefined,
      price: parseFloat(price),
      category,
      description: description.trim() || undefined,
      image: image || undefined,
      available,
      popular,
      modifierGroups: selectedModifiers.length > 0 ? selectedModifiers : undefined,
    });
  };

  const toggleModifier = (id: string) => {
    setSelectedModifiers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-card border-l border-border flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h3 className="text-[15px] font-semibold text-foreground">{isNew ? t("addCategory") : t("editItem")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pos-scrollbar px-5 py-4 space-y-5">
          {/* Image Section */}
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{t("uploadImage")}</span>
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-[120px] h-[90px] rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0",
                image ? "border-primary/30" : "border-border"
              )}>
                {image ? (
                  <img src={image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-1.5">
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileUpload} />
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 w-full" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3 w-3" /> {t("uploadImage")}
                </Button>
                {showUrlInput ? (
                  <div className="flex gap-1">
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..."
                      className="flex-1 h-7 px-2 rounded-md bg-background border border-border text-[10px] focus:outline-none focus:border-primary" />
                    <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={handleUrlSubmit}><Link className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 w-full" onClick={() => setShowUrlInput(true)}>
                    <Link className="h-3 w-3" /> {t("imageUrl")}
                  </Button>
                )}
                {image && (
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] text-status-red w-full" onClick={() => setImage("")}>
                    {t("removeImage")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">{t("itemDetails")}</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Name *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">中文名</label>
                <input value={nameZh} onChange={e => setNameZh(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">{t("optionPrice")} *</label>
                <input type="number" step="0.1" value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] font-mono focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">{t("categoryName")}</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-[12px] text-foreground">
              <Switch checked={available} onCheckedChange={setAvailable} /> Available
            </label>
            <label className="flex items-center gap-2 text-[12px] text-foreground">
              <Switch checked={popular} onCheckedChange={setPopular} /> Popular
            </label>
          </div>

          {/* Modifier Groups */}
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{t("modifierGroups")}</span>
            <div className="space-y-1">
              {modifierGroups.map(mg => (
                <label key={mg.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer text-[12px]">
                  <input type="checkbox" checked={selectedModifiers.includes(mg.id)}
                    onChange={() => toggleModifier(mg.id)} className="rounded" />
                  <span className="text-foreground">{mg.name}</span>
                  {mg.nameZh && <span className="text-muted-foreground">({mg.nameZh})</span>}
                  <span className="text-[10px] text-muted-foreground ml-auto">{mg.options.length} options</span>
                </label>
              ))}
            </div>
          </div>

          {/* Recipe / Ingredients */}
          {item.id && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ChefHat className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("ingredients")}</span>
              </div>
              <RecipeEditor menuItemId={item.id} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
          <Button variant="outline" className="flex-1 h-9 text-[12px]" onClick={onClose}>{t("cancel")}</Button>
          <Button className="flex-1 h-9 text-[12px]" onClick={handleSave} disabled={!name.trim() || !price}>{t("confirm")}</Button>
        </div>
      </div>
    </div>
  );
};
