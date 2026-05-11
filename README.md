# React Text Editor

A rich text editor component for React built on ProseMirror.

## Example

```tsx
import { TextEditor } from "dn-react-text-editor";

function App() {
  return (
    <TextEditor
      placeholder="Write something..."
      onChange={(e) => {
        console.log(e.target.value);
      }}
    />
  );
}
```
