# SwiftUI: Use API’s Google Font (accountNameFont) for Account Name

The link tree API returns `account.accountNameFont` (e.g. `"Dancing Script"`, `"Inter"`). The web page loads that font from Google Fonts and uses it for the account name. In SwiftUI, system fonts are used by default, so the account name looks different. This prompt describes how to **load the same Google Font at runtime** and apply it to the account name in SwiftUI so it matches the web.

---

## 1. Goal

- **API field:** `account.accountNameFont` (String, optional). Example: `"Dancing Script"`, `"Inter"`, `"Plus Jakarta Sans"`.
- **Use in app:** Display `account.accountName` in SwiftUI using that font (e.g. 32 pt, semibold, centered).
- **If empty or invalid:** Use a system font (e.g. `.system(size: 32, weight: .semibold)`).

---

## 2. Why It’s Different on Web vs SwiftUI

- **Web:** The page injects `<link href="https://fonts.googleapis.com/css2?family=...">` and sets `font-family: 'Dancing Script', sans-serif` in CSS. The browser loads the font from Google and renders it.
- **SwiftUI:** There is no built-in “Google Fonts”. You must either:
  - **Option A:** Load the font at runtime (download from Google, register with the system, use `Font.custom(...)`), or  
  - **Option B:** Bundle a fixed set of .ttf/.otf Google Fonts and map `accountNameFont` to a bundled font when it matches.

This prompt focuses on **Option A (runtime load)** so any font name returned by the API can be used without bundling.

---

## 3. Runtime Approach: Load Google Font in SwiftUI

### 3.1 Steps

1. **Get font name from API**  
   Use `account.accountNameFont` (trimmed). If nil or empty, skip custom font.

2. **Resolve font file URL from Google**  
   - Request the Google Fonts CSS for that family, e.g.  
     `https://fonts.googleapis.com/css2?family={Font+Name}:wght@400;600;700&display=swap`  
     Encode the family name: spaces → `+` (e.g. `Dancing Script` → `Dancing+Script`).
   - Set the request’s **User-Agent** to a Safari/iOS string so Google returns a format iOS can use (e.g. .ttf). Example:  
     `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1`
   - Parse the response CSS (string): find `url(https://fonts.gstatic.com/...)` (or similar) and extract the first font file URL. Google may return multiple `@font-face` blocks (e.g. 400, 600, 700); use the first URL that points to a .ttf or .otf (or the first URL if only one format is returned).

3. **Download font data**  
   - `URLSession.shared.data(from: fontFileURL)` (or equivalent).
   - Write to a temporary file (e.g. `FileManager.default.temporaryDirectory`) with a unique name based on the font name.

4. **Register the font with the system**  
   - Use **Core Text**:  
     `CTFontManagerRegisterFontURLs([fontFileURL] as CFArray, .process, true, nil)`  
     or `CTFontManagerRegisterFontsWithAssetNames` if you have a bundle asset.  
   - If registration fails (e.g. invalid file), fall back to system font.

5. **Use in SwiftUI**  
   - After registration, the font is available by its **PostScript name** or **family name**. Many Google Fonts use the same string as the family name (e.g. `"Dancing Script"`).
   - Apply it to the account name:  
     `Text(account.accountName)`  
       `.font(.custom(registeredFontName, size: 32))`  
       `.fontWeight(.semibold)`  // if supported; some custom fonts don’t map weight the same  
   - Prefer the **family name** for `.custom()` so it matches the API (e.g. `"Dancing Script"`). If that doesn’t work, try the PostScript name from the font file.

6. **Caching**  
   - Cache by `accountNameFont` (e.g. in memory or on disk): once a font is downloaded and registered, reuse it for the same name so you don’t re-fetch on every appear.

7. **Fallback**  
   - If any step fails (no font name, network error, parse error, registration failure), use a system font:  
     `.font(.system(size: 32, weight: .semibold))`.

---

## 4. Implementation Outline (Swift)

- **FontLoader (or similar)**  
  - Input: font family name (e.g. `"Dancing Script"`).  
  - Output: registered font name to use in `Font.custom(_:size:)`, or nil to fallback.  
  - Internals:  
    - Check cache; if hit, return cached registered name.  
    - Build Google Fonts CSS URL; request with iOS User-Agent.  
    - Parse CSS for first `url(https://fonts.gstatic.com/...)`; download that URL.  
    - Save to temp file; call `CTFontManagerRegisterFontURLs`; store result (e.g. the family name you used) in cache.  
    - On any error, return nil.

- **Account name view**  
  - When you have `account.accountName` and `account.accountNameFont`:  
    - Call your FontLoader with `account.accountNameFont`.  
    - If you get a registered name back:  
      `Text(account.accountName).font(.custom(registeredName, size: 32))` (and optional `.fontWeight(.semibold)` if it looks right).  
    - Else:  
      `Text(account.accountName).font(.system(size: 32, weight: .semibold))`.  
  - You can wrap this in a small helper view that takes `name` and `fontName`, and shows a loading/placeholder state until the font is registered (e.g. show system font until async load completes, then switch to custom font).

- **Async behavior**  
  - Font loading is async (network + registration). Show the account name immediately with the system font, then when the custom font is ready, update the view to use it (e.g. `@State var customFontName: String?`; when FontLoader finishes, set `customFontName` and use it in `.font(.custom(customFontName!, size: 32))`).

---

## 5. CSS Parsing Note

Google’s CSS response can look like:

```css
@font-face {
  font-family: 'Dancing Script';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/dancingscript/v24/...) format('woff2');
}
```

- Prefer a `src` URL that points to **.ttf** or **.otf** when available (iOS can register these directly).  
- If only **woff2** is returned for iOS User-Agent, you have two options: (1) try a different User-Agent that requests .ttf, or (2) use a woff2-to-ttf conversion step (more complex).  
- Regex or a simple string search for `url(https://fonts.gstatic.com/...)` is usually enough to get the first font file URL.

---

## 6. Alternative: Bundled Fonts

If you prefer not to load from the network:

- Bundle a curated set of Google Fonts (.ttf) in the app target (or App Clip).  
- Map `account.accountNameFont` to a bundled font name (e.g. “Dancing Script” → same name if you bundled it).  
- Use `Font.custom(fontName, size: 32)` only when the name is in your set; otherwise fallback to system font.  
- This gives consistent, fast loading and works offline, but only for the fonts you bundle.

---

## 7. Checklist for SwiftUI

- [ ] Read `account.accountNameFont` from the link tree API response.
- [ ] If non-empty, resolve Google Font URL (CSS → font file URL) with an iOS User-Agent.
- [ ] Download font file, register with `CTFontManagerRegisterFontURLs` (or equivalent).
- [ ] Cache by font name to avoid re-downloading.
- [ ] Display account name with `Font.custom(registeredFontName, size: 32)` when available.
- [ ] Fallback to `.system(size: 32, weight: .semibold)` when font name is empty or loading fails.
- [ ] Handle async: show account name immediately with system font, then switch to custom font when loaded so the app matches the web’s use of the API’s Google Font.

Use this prompt to implement the account name font in SwiftUI so it matches the web (and WebView) behavior using the same API field.
