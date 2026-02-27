

# Plan: Enhance Profile Dropdown Menu Icons and Naming

## Single File Change: `src/components/header/HeaderActions.tsx`

### Current State
- "Dashboard" item: no icon
- "Admin Panel" item: has Shield icon ✓
- "Profile" item: no icon
- "Feedback" item: no icon
- "Settings" item: has Settings icon ✓
- "Sign Out" item: has LogOut icon ✓

### Changes

1. Add imports: `LayoutDashboard`, `User`, `MessageSquare` from `lucide-react`

2. Line ~131: `"Dashboard"` → `<LayoutDashboard className="mr-2 h-3.5 w-3.5" /> My Dashboard`

3. Line ~138: `"Profile"` → `<User className="mr-2 h-3.5 w-3.5" /> Profile`

4. Line ~141: `"Feedback"` → `<MessageSquare className="mr-2 h-3.5 w-3.5" /> Feedback`

All other items already have icons. Icon size stays `h-3.5 w-3.5` to match existing icons in the dropdown.

