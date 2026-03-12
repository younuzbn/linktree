# SwiftUI Link Tree View + App Clip – Implementation Prompt

Use this document to build a **SwiftUI ContentView** that matches the [linktree.kochi.one](https://linktree.kochi.one/?BIS=BIS99999) page design and uses the same API. The same UI will be used inside an **App Clip** that opens from a URL and extracts the BIS id to fetch the link tree.

---

## 1. Incoming URL (App Clip)

- **URL scheme:** `https://linktree.kochi.one/?BIS=BIS99999`
- The App Clip target should:
  1. Handle the incoming URL (e.g. via `onContinueUserActivity` or App Clip invocation).
  2. **Extract the `BIS` query parameter** from the URL (e.g. `BIS99999`).
  3. Call the public API with that BIS value to load the link tree.
- If no BIS is present in the URL, show an error or empty state asking for a valid link.

---

## 2. API

- **Method:** `GET`
- **URL:** `{API_BASE_URL}/api/public/linktree?BIS={BIS_VALUE}`
  - Example: `https://www.kochi.one/api/public/linktree?BIS=BIS99999`
  - Replace `API_BASE_URL` with your backend base (e.g. from config or `Info.plist`).
- **Authentication:** None (public endpoint).
- **Response (success):**

```json
{
  "status": "success",
  "data": {
    "account": {
      "accountName": "Cafe Agape",
      "accountNameFont": "Inter",
      "BIS": "BIS99999",
      "isBannerHidden": false,
      "bannerImage": {
        "url": "https://..."
      },
      "isRedirectionEnabled": false,
      "redirectionUrl": null,
      "buttons": [
        {
          "label": "Follow us on Instagram",
          "link": "https://instagram.com/...",
          "order": 0,
          "isVisible": true,
          "icon": {
            "url": "https://..."
          }
        }
      ]
    }
  }
}
```

- **Response (not found, 404):** `{ "status": "error", "message": "Link tree account not found" }`
- **Response (missing BIS, 400):** `{ "status": "error", "message": "BIS parameter is required" }`

**Redirection:** If `account.isRedirectionEnabled == true` and `account.redirectionUrl` is non-empty, open that URL (e.g. in Safari or in-app) and optionally dismiss the link tree view.

---

## 3. Page Design (Match linktree.kochi.one)

Replicate this layout and behavior:

### 3.1 Overall layout

- **Background:** Light gray (e.g. `#f5f5f7` or `Color(red: 0.96, green: 0.96, blue: 0.97)`).
- **Content:** Vertically scrollable; max width ~600 pt, centered; padding ~20 pt.
- **Order from top to bottom:**
  1. **Banner** (if present and not hidden)
  2. **Account name** (heading)
  3. **List of buttons**
  4. **Footer:** “www.kochi.one” (tappable link)

### 3.2 Loading state

- Full-screen loading view (e.g. centered “Loading…” or a simple spinner).
- Shown until the API returns successfully (or error).

### 3.3 Banner

- Shown only if `account.bannerImage?.url` is non-empty and `account.isBannerHidden != true`.
- Full width of content area, aspect fit or similar; corner radius ~12–16 pt.
- No banner section if hidden or no URL.

### 3.4 Account name

- **Text:** `account.accountName` (e.g. “Cafe Agape”).
- **Style:** Large heading, font size ~32 pt, font weight semibold (600), color `#1d1d1f`, centered.
- **Custom font (required to match web):** The API returns `account.accountNameFont` (e.g. `"Dancing Script"`, `"Inter"`). The web loads this from Google Fonts and uses it for the account name. In SwiftUI you must **use the same font** so the app does not show a normal/system font while the web (or a WebView) shows the custom one. Do **not** leave the account name in a system font when the API provides a font name.
  - **How to apply:** See the dedicated prompt **`SWIFTUI_GOOGLE_FONT_PROMPT.md`** in this folder. It describes how to load the Google Font at runtime (fetch CSS → parse font file URL → download → register with Core Text → use `Font.custom(...)`) and optionally cache it. Use that approach so the account name in SwiftUI matches the web’s Google Font.
  - If `accountNameFont` is empty or font loading fails, fall back to `.system(size: 32, weight: .semibold)`.

### 3.5 Buttons section

- **List:** Only include buttons where `isVisible != false`, sorted by `order` (ascending).
- **Spacing:** Vertical gap between buttons ~12–16 pt.

**Each button card:**

- **Layout:** Row with **label on the left** and **icon on the right** (same as current web: label left, icon right).
- **Background:** White.
- **Border:** Light gray `#e5e5e7`, 1–1.5 pt; corner radius 12 pt.
- **Padding:** Horizontal ~20 pt, vertical ~16–20 pt.
- **Shadow:** Subtle (e.g. 0 2 8 black 5%).
- **Content:**
  - **Label:** `button.label` (e.g. “Follow us on Instagram”). Left-aligned, font size ~16–18 pt, medium weight (500), color `#1d1d1f`.
  - **Icon:** Right-aligned. If `button.icon?.url` is present, show an async image (48×48 pt, corner radius 8 pt, aspect fit/cover). If no icon URL, show a placeholder (e.g. link symbol or small gray box).
- **Tap:** Open `button.link` in Safari (or in-app browser). Use `URL(string: button.link)` and open externally.

### 3.6 Footer

- Text: “www.kochi.one”.
- Style: Centered, color `#86868b`, font size ~14 pt; top padding ~40 pt.
- Tap: Open `https://www.kochi.one` (or your main site).

### 3.7 Error state

- If API returns 404/400 or network fails: show a clear message (e.g. “Link tree not found” or “Invalid link”) and optionally a short explanation (e.g. “No account for this BIS”).

---

## 4. SwiftUI Structure Suggestions

- **App Clip entry:** Parse the incoming URL, read `BIS` from query, pass it to the main view (e.g. as a `@State` or binding).
- **ContentView (or main view):**
  - Input: `BIS: String` (e.g. “BIS99999”).
  - On appear (or when BIS is set): `GET {API_BASE_URL}/api/public/linktree?BIS={BIS}`.
  - State: loading / success(account) / error.
  - Success: show banner (if any) → account name → list of buttons → footer.
  - Use the same layout and styling as above so it matches the web page.

---

## 5. API Base URL

- **Web:** linktree.kochi.one fetches from `API_BASE_URL` (e.g. backend server).
- **App Clip:** Use the same backend base URL (e.g. `https://www.kochi.one` or your API domain). Configure it in the App Clip target (e.g. `Info.plist`, config file, or environment) so you can switch between staging and production.

---

## 6. Summary Checklist

- [ ] App Clip opens from `https://linktree.kochi.one/?BIS=BIS99999` and extracts `BIS`.
- [ ] Single API call: `GET /api/public/linktree?BIS={BIS}` (no auth).
- [ ] Loading state until response.
- [ ] If redirection enabled, open `redirectionUrl` and optionally exit.
- [ ] Layout: Banner (optional) → Account name → Buttons (label left, icon right) → Footer.
- [ ] **Account name font:** Use `account.accountNameFont` from the API and load that Google Font at runtime so the account name in SwiftUI matches the web (see `SWIFTUI_GOOGLE_FONT_PROMPT.md`). Do not show a normal/system font when the API returns a custom font name.
- [ ] Buttons: filter by `isVisible`, sort by `order`, open `link` in Safari.
- [ ] Handle 404/400 and network errors with a clear message.
- [ ] Match colors, spacing, and typography of the linktree.kochi.one page.

Use this prompt to generate the SwiftUI `ContentView` (and any models for the API response) so the App Clip experience matches the web design and uses the same API.
