# Global Cursors - Usage Examples

## 🎯 Quick Start

The Global Cursor system is now automatically active for all routes under `/dashboard/projects/[id]/`.

No setup required - just navigate to any project and see real-time cursors!

## 📍 Current Routes with Cursor Support

All routes under the project layout automatically support global cursors:

```
/dashboard/projects/[id]              ← Main project view (Estimate)
/dashboard/projects/[id]/catalog      ← Catalog (if you create this route)
/dashboard/projects/[id]/settings     ← Settings (if you create this route)
/dashboard/projects/[id]/analytics    ← Analytics (if you create this route)
```

## 🔌 Using Presence Data in Your Component

### Example 1: Show Active Users Count

```tsx
"use client";

import { useGlobalPresence } from "@/components/project/global-presence-provider";

export default function MyProjectPage() {
  const { usersOnSameRoute, otherUsers } = useGlobalPresence();

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <h1>My Project Page</h1>
        
        {/* Show users on THIS page */}
        {usersOnSameRoute.length > 0 && (
          <span className="text-sm text-muted-foreground">
            👥 {usersOnSameRoute.length} viewing this page
          </span>
        )}
        
        {/* Show total users in project */}
        {otherUsers.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({otherUsers.length} total in project)
          </span>
        )}
      </div>
      
      {/* Your page content */}
    </div>
  );
}
```

### Example 2: Add Sidebar Navigation with Indicators

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RouteIndicator } from "@/components/project/project-route-indicators";

export function ProjectSidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const routes = [
    { path: `/dashboard/projects/${projectId}`, label: "Kosztorys" },
    { path: `/dashboard/projects/${projectId}/catalog`, label: "Katalog" },
    { path: `/dashboard/projects/${projectId}/settings`, label: "Ustawienia" },
  ];

  return (
    <nav className="space-y-1 p-4">
      {routes.map((route) => (
        <Link
          key={route.path}
          href={route.path}
          className={`flex items-center justify-between px-3 py-2 rounded-lg ${
            pathname === route.path
              ? "bg-blue-100 text-blue-900"
              : "hover:bg-slate-100"
          }`}
        >
          <span>{route.label}</span>
          
          {/* Shows green badge with user count if anyone is on this route */}
          <RouteIndicator route={route.path} compact />
        </Link>
      ))}
    </nav>
  );
}
```

### Example 3: Show Active Locations Panel

```tsx
"use client";

import { ActiveRoutesIndicator } from "@/components/project/project-route-indicators";

export function CollaborationPanel() {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold mb-3">Team Activity</h3>
      
      {/* Shows all routes with active users */}
      <ActiveRoutesIndicator />
    </div>
  );
}
```

### Example 4: Custom Route Activity Display

```tsx
"use client";

import { useGlobalPresence } from "@/components/project/global-presence-provider";

export function RouteActivityMap({ projectId }: { projectId: string }) {
  const { routeActivity, otherUsers } = useGlobalPresence();

  // Get all routes with users
  const activeRoutes = Object.entries(routeActivity)
    .filter(([_, count]) => count > 0)
    .map(([route, count]) => {
      // Get users on this route
      const usersOnRoute = otherUsers.filter(u => u.route === route);
      return { route, count, users: usersOnRoute };
    });

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">Where is everyone?</h4>
      
      {activeRoutes.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No other users active
        </p>
      ) : (
        <div className="space-y-1">
          {activeRoutes.map(({ route, count, users }) => (
            <div key={route} className="flex items-center gap-2 text-xs">
              <span className="font-medium">{getRouteName(route)}:</span>
              <div className="flex -space-x-1">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to extract friendly route name
function getRouteName(pathname: string): string {
  const parts = pathname.split('/');
  const lastPart = parts[parts.length - 1];
  
  // Map route segments to Polish names
  const nameMap: Record<string, string> = {
    'catalog': 'Katalog',
    'settings': 'Ustawienia',
    'analytics': 'Analiza',
  };
  
  return nameMap[lastPart] || 'Projekt';
}
```

### Example 5: Connection Status Indicator

```tsx
"use client";

import { useGlobalPresence } from "@/components/project/global-presence-provider";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const { isConnected, otherUsers } = useGlobalPresence();

  return (
    <div className="flex items-center gap-2 text-xs">
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 text-green-500" />
          <span className="text-green-700">
            Live {otherUsers.length > 0 && `· ${otherUsers.length} online`}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500">Offline</span>
        </>
      )}
    </div>
  );
}
```

## 🎨 Styling Tips

### Cursor Layer

The cursor overlay has `z-index: 9999` and uses fixed positioning. To ensure your modals appear above cursors (if needed), use:

```tsx
// For special cases where you need content above cursors
<div className="relative z-[10000]">
  {/* Your modal content */}
</div>
```

### Route Indicator Colors

Customize the green indicator:

```tsx
<Badge className="bg-purple-500 hover:bg-purple-600">
  {userCount}
</Badge>
```

## 🔍 Debugging

### Check Presence State

```tsx
const { presenceState, currentUser } = useGlobalPresence();

console.log('Current User:', currentUser);
console.log('All Presence:', presenceState);
```

### Monitor Route Changes

```tsx
const { routeActivity } = useGlobalPresence();

useEffect(() => {
  console.log('Route Activity Changed:', routeActivity);
}, [routeActivity]);
```

## 🚀 Advanced Usage

### Trigger Action When User Joins Your Route

```tsx
const { usersOnSameRoute } = useGlobalPresence();
const prevCountRef = useRef(0);

useEffect(() => {
  const currentCount = usersOnSameRoute.length;
  
  if (currentCount > prevCountRef.current) {
    // Someone just joined this route!
    toast({
      title: "Collaborator joined",
      description: `${usersOnSameRoute[currentCount - 1]?.name} is now viewing this page`,
    });
  }
  
  prevCountRef.current = currentCount;
}, [usersOnSameRoute]);
```

### Show "Follow Me" Button

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useGlobalPresence } from "@/components/project/global-presence-provider";

export function FollowUserButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const { otherUsers } = useGlobalPresence();
  
  const targetUser = otherUsers.find(u => u.user_id === targetUserId);
  
  if (!targetUser?.route) return null;
  
  return (
    <button
      onClick={() => router.push(targetUser.route)}
      className="text-xs text-blue-600 hover:underline"
    >
      Follow {targetUser.name} →
    </button>
  );
}
```

## 📋 API Reference

### useGlobalPresence()

Returns:

```typescript
{
  presenceState: PresenceState;           // Raw presence data
  currentUser: UserPresence | null;       // Your presence info
  otherUsers: UserPresence[];             // All other users
  usersOnSameRoute: UserPresence[];       // Users on your current route
  routeActivity: Record<string, number>;  // User count per route
  isConnected: boolean;                   // Connection status
  broadcastCursor: (x, y) => void;        // Manual cursor broadcast
  updatePresence: (updates) => void;      // Update your presence
}
```

### UserPresence Type

```typescript
interface UserPresence {
  user_id: string;
  name: string;
  email: string;
  color: string;        // Hex color (e.g., "#3B82F6")
  online_at: string;    // ISO timestamp
  route?: string;       // Current pathname
  cursor?: {
    x: number;          // Viewport X coordinate
    y: number;          // Viewport Y coordinate
    timestamp: number;  // Cursor update time
  };
}
```

## ✅ Best Practices

1. **Route Naming:** Use descriptive route names for better UX
2. **Indicators:** Add route indicators to all navigation elements
3. **Performance:** The system is already throttled - no additional optimization needed
4. **Privacy:** Cursor positions are only shared within the project
5. **Cleanup:** Automatic - no manual cleanup required

---

**Need help?** Check the main documentation at `V4.0_GLOBAL_CURSORS.md`
