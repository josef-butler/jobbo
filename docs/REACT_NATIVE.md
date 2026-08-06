# React Native — if the interview goes mobile

This is a contingency plan, not a pre-built setup. Low probability but worth
having a crisp answer. Do NOT pre-install anything unless the interview
explicitly calls for it.

## The 30-second answer

> "React Native with Expo shares the same React component model. Our hooks,
> types, and React Query data layer port directly. The main differences are
> `<View>` instead of `<div>`, `StyleSheet.create` instead of Tailwind classes,
> and native navigation. If we want to validate this direction, I'd start with
> a PWA — same codebase, works on mobile today, no native toolchain needed.
> Then graduate to Expo when we need camera/notifications/offline."

## If they want to see mobile code

### Setup (run on demand, ~2 min)

```bash
npx create-expo-app@latest JobboMobile --template blank-typescript
cd JobboMobile
npx expo start    # QR code → scan with Expo Go on phone; 'w' for web
```

Dependencies to add as needed:

```bash
npx expo install @tanstack/react-query   # same API as web
npx expo install react-native-svg         # for Gantt chart drawing
npx expo install expo-router              # file-based navigation (usually included)
```

### Component mapping quick-ref

| Web | React Native |
|---|---|
| `<div>` | `<View>` |
| `<span>`, `<p>` | `<Text>` |
| `className="flex p-4"` | `style={{ flex: 1, padding: 16 }}` |
| `onClick` | `onPress` (on Pressable/TouchableOpacity) |
| `<input>` | `<TextInput>` |
| Tailwind v4 | `StyleSheet.create({...})` — same flexbox model |

### What ports directly

- **`types.ts`** — identical
- **`useSchedule.ts`** — same React Query hooks (`useQuery`, `useMutation`)
- **Component logic** — same `useState`, `useEffect`, props, context
- **`fetch('/output.json')`** — same fetch API, same JSON structure

### What needs rewriting

- **Tailwind classes → StyleSheet** — one-time mechanical conversion
- **Base UI components → RN primitives** — Dialog → Modal, Select → Picker
- **GanttChart** — SVG bars via `react-native-svg` instead of DOM elements
- **JobList** — `FlatList` instead of `.map()` for performance

### PWA fallback (the safer demo)

If native tooling overhead risks derailing the interview, pivot to PWA:

```html
<!-- public/manifest.json -->
{ "name": "Jobbo", "start_url": "/", "display": "standalone" }
```

```ts
// In main.tsx — register a service worker for offline caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

Same React code. Works in mobile browsers. "Add to Home Screen" gives near-native
feel. This is the pragmatic stepping stone: prove the mobile use case without
the native toolchain tax during an interview.

## If they ask about native-specific features

| Feature | Approach |
|---|---|
| Push notifications | Expo Notifications (`expo-notifications`) |
| Offline-first | React Query `persister` + `AsyncStorage` |
| Camera (site photos) | Expo Camera (`expo-camera`) |
| GPS / site check-in | Expo Location (`expo-location`) |

Each is a one-line `npx expo install` away. Don't pre-install.
