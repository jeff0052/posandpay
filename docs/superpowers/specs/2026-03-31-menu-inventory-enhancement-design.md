# Menu Management, Recipe & Inventory Enhancement Design Spec

**Date:** 2026-03-31
**Status:** Draft
**Scope:** Three subsystems — (1) Menu management CRUD with categories, images, modifiers; (2) Recipe/BOM linking menu items to inventory ingredients; (3) Inventory intake with manual entry and OCR UI scaffold

## 1. Problem

The admin menu management page is basic — no category CRUD, no image upload, no modifier group management. Inventory lacks recipe-based consumption tracking. There's no streamlined way to record incoming stock from supplier invoices.

## 2. Goals

1. **Menu Management**: Full CRUD for categories, menu items with image upload, modifier group management
2. **Recipe/BOM**: Link each menu item to ingredient quantities from inventory, calculate costs and projected usage
3. **Inventory Intake**: Manual multi-line receiving form + OCR invoice scan UI scaffold (mock parser, real API later)

## 3. Non-Goals

- Supabase persistence (stay in mock/store mode)
- Real OCR API integration (UI scaffold with mock results only)
- Drag-and-drop reordering (use sort_order numbers)
- Mobile admin UI

---

## Part 1: Menu Management Enhancement

### 4.1 Category Management

**New type:**
```typescript
interface Category {
  id: string;
  name: string;
  nameZh?: string;
  sortOrder: number;
}
```

**New store:** `src/state/category-store.ts` following the same `useSyncExternalStore` pattern as menu-store.

**UI:** New "Categories" tab in AdminMenu.
- List of categories with inline edit (name, nameZh)
- Add/delete buttons
- Sort order up/down arrows
- "All" and "Popular" are system categories (not deletable)

**Impact:** MenuComposer, QRMenuBrowser, KioskMenu all read from category store instead of hardcoded `categories` array.

### 4.2 Image Upload

**Approach:** File input → canvas resize (max 400px) → base64 Data URL stored in `MenuItem.image` field. Also support pasting an external URL.

**UI in menu item editor:**
- Image preview area (120x90px)
- "Upload" button → file picker (accept image/*)
- "URL" button → text input for external URL
- "Remove" button when image exists
- Compress to JPEG quality 0.7 before base64 encoding

### 4.3 Modifier Group Management

**UI:** New "Modifiers" tab in AdminMenu.
- List all modifier groups with their options
- Add/edit/delete groups
- Within each group: add/edit/delete options (name, nameZh, price)
- Store changes via new functions in menu-store (`addModifierGroup`, `updateModifierGroup`, `deleteModifierGroup`)

**In menu item editor:** Multi-select checkboxes to link modifier groups to a menu item.

### 4.4 Menu Item Editor Enhancement

Replace current inline editing with a **slide-out drawer panel** (right side, 480px wide):
- Basic info: name, nameZh, price, category (dropdown from category store), description
- Image: upload/URL/remove (section 4.2)
- Availability: available toggle, popular toggle
- Modifiers: checkbox list of modifier groups
- Combo config (when isCombo): visual combo group editor
- Recipe: ingredient list (Part 2, section 5.1)
- Save / Cancel buttons at bottom

---

## Part 2: Recipe/BOM System

### 5.1 Data Model

**New types in mock-data.ts:**
```typescript
interface RecipeIngredient {
  inventoryItemId: string;
  quantity: number;
  unit: string;  // "g", "ml", "pcs"
}

// Stored as a map in recipe-store: menuItemId → RecipeIngredient[]
```

**New store:** `src/state/recipe-store.ts`
- `useRecipe(menuItemId)` → `RecipeIngredient[]`
- `setRecipe(menuItemId, ingredients)` → save recipe
- `getAllRecipes()` → full map for inventory calculations

### 5.2 UI — Recipe Editor (inside menu item editor)

- "Ingredients" section at bottom of the item editor drawer
- "Add Ingredient" button → select from inventory items (searchable dropdown) + quantity input + unit
- List of current ingredients with edit/delete
- Show estimated cost per serving: sum(ingredient.quantity × inventoryItem.costPerUnit)

### 5.3 Inventory Integration

- `AdminInventory.tsx` Stock List: new column "Linked Items" showing how many menu items use this ingredient
- New KPI card: "Projected Daily Usage" = sum of (today's sales × recipe quantities) for each ingredient
- Stock List: "Available Portions" = min(currentStock ÷ recipeQuantity) across all ingredients for each linked menu item

---

## Part 3: Inventory Intake Enhancement

### 6.1 Manual Receiving Form

Replace the simple stock adjustment modal with a full **Receiving Form** (new tab or enhanced modal):

- Multi-line entry table:
  | Ingredient (searchable dropdown) | Quantity | Unit | Unit Cost | Subtotal |
  - Add row / remove row buttons
  - Supplier field (shared for all lines)
  - Total cost auto-calculated
- "Submit" creates multiple stock movements (type: "receive") and optionally creates a purchase order record

### 6.2 OCR Invoice Scan UI

**Button:** "Scan Invoice" in the inventory page header (next to "Add Stock" button)

**Flow:**
1. Click "Scan Invoice" → file upload dialog (accept image/*, capture=camera for mobile)
2. Show image preview in a modal
3. "Analyze" button → calls `parseInvoiceImage()` function
4. Mock implementation: returns pre-defined sample results after 1.5s delay
5. Results shown as editable table (same format as manual receiving form)
6. User reviews/edits → Submit

**Interface for future API integration:**
```typescript
interface ParsedInvoiceLine {
  itemName: string;        // raw text from invoice
  matchedItemId?: string;  // best match from inventory
  quantity: number;
  unit: string;
  unitCost: number;
  confidence: number;      // 0-1 confidence score
}

// Mock implementation
async function parseInvoiceImage(file: File): Promise<ParsedInvoiceLine[]> {
  await new Promise(r => setTimeout(r, 1500)); // simulate API delay
  return MOCK_INVOICE_RESULTS;
}
```

---

## 7. Component Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/state/category-store.ts` | Category CRUD store |
| `src/state/recipe-store.ts` | Recipe/BOM store (menuItemId → ingredients[]) |
| `src/components/admin/MenuItemDrawer.tsx` | Full menu item editor drawer panel |
| `src/components/admin/CategoryManager.tsx` | Category list CRUD tab |
| `src/components/admin/ModifierManager.tsx` | Modifier group management tab |
| `src/components/admin/RecipeEditor.tsx` | Recipe ingredient editor (used inside drawer) |
| `src/components/admin/ReceivingForm.tsx` | Multi-line stock receiving form |
| `src/components/admin/InvoiceScanner.tsx` | OCR upload + preview + mock results |
| `src/lib/image-utils.ts` | Image compression and base64 conversion |

### Modified Files

| File | Changes |
|------|---------|
| `src/data/mock-data.ts` | Add Category, RecipeIngredient interfaces; make categories mutable |
| `src/state/menu-store.ts` | Add modifier group CRUD functions |
| `src/pages/admin/AdminMenu.tsx` | 4 tabs (Items, Combos, Categories, Modifiers); open drawer on edit; image upload |
| `src/pages/admin/AdminInventory.tsx` | Add Receiving Form tab; "Scan Invoice" button; linked items column; projected usage KPI |
| `src/hooks/useLanguage.tsx` | New translation keys for all new UI |

## 8. Localization

Key new translations needed (~40 keys):
- Category management: addCategory, editCategory, deleteCategory, categoryName, sortOrder
- Image: uploadImage, imageUrl, removeImage, dragOrClick
- Modifiers: modifierGroups, addModifier, optionName, optionPrice
- Recipe: ingredients, addIngredient, quantityPerServing, estimatedCost, linkedItems, availablePortions
- Inventory: receivingForm, scanInvoice, analyzing, addRow, supplier, totalCost, submitReceiving
- OCR: scanResult, confidence, matchedItem, reviewAndSubmit

## 9. Mock Data

### Mock Recipes (pre-populate for a few menu items)
- Satay (10pc): 100g pork, 20g cucumber, 30g onion, 5g turmeric, 10ml peanut sauce
- Chicken Rice: 200g chicken, 150g rice, 10g ginger, 5g garlic, 5ml sesame oil
- Laksa: 100g noodles, 50g shrimp, 200ml coconut milk, 20g laksa paste, 10g beansprouts
- Bak Kut Teh: 300g pork ribs, 10g garlic, 5g pepper, 3g star anise, 500ml broth

### Mock Invoice OCR Results
```typescript
const MOCK_INVOICE_RESULTS: ParsedInvoiceLine[] = [
  { itemName: "Pork Belly 五花肉", matchedItemId: "inv-pork", quantity: 10, unit: "kg", unitCost: 12.50, confidence: 0.95 },
  { itemName: "Jasmine Rice 茉莉香米", matchedItemId: "inv-rice", quantity: 25, unit: "kg", unitCost: 3.20, confidence: 0.92 },
  { itemName: "Coconut Milk 椰浆", matchedItemId: "inv-coconut", quantity: 20, unit: "L", unitCost: 4.80, confidence: 0.88 },
  { itemName: "Fresh Prawns 鲜虾", matchedItemId: "inv-shrimp", quantity: 5, unit: "kg", unitCost: 18.00, confidence: 0.90 },
  { itemName: "Bean Sprouts 豆芽", quantity: 3, unit: "kg", unitCost: 2.50, confidence: 0.72 },
];
```

## 10. Edge Cases

1. **Delete category with items**: Warn user, move items to "Uncategorized" or block deletion
2. **Delete ingredient used in recipe**: Warn user, show affected menu items
3. **Image too large**: Compress to max 400px width, JPEG quality 0.7
4. **OCR low confidence**: Highlight rows with confidence < 0.8 in amber, < 0.6 in red
5. **Recipe with missing inventory item**: Show "item not found" warning
