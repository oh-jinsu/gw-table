import {
  createInnerHTML,
  TextEditor,
  TextEditorController,
  TextEditorTool,
} from "gw-react-text-editor";
import { useRef, type RefObject } from "react";
import "highlight.js/styles/github.css";

export default function App() {
  const controllerRef = useRef<TextEditorController>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <Toolbar controller={controllerRef} />
      <div className="app">
        <TextEditor
          ref={controllerRef}
          className="text-editor"
          placeholder="Start typings..."
          defaultValue={"<p>Hello world!</p>"}
          onChange={(e) => {
            previewRef.current!.innerHTML = createInnerHTML(e);
          }}
        />
        <div ref={previewRef} className="preview" />
      </div>
    </div>
  );
}

function Toolbar({
  controller,
}: {
  controller: RefObject<TextEditorController | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const withTool = (fn: (tool: TextEditorTool) => void) => {
    if (controller.current) {
      fn(new TextEditorTool(controller.current));
    }
  };

  return (
    <div className="toolbar">
      <button type="button" onClick={() => withTool((t) => t.undo())}>
        Undo
      </button>
      <button type="button" onClick={() => withTool((t) => t.redo())}>
        Redo
      </button>
      <button type="button" onClick={() => withTool((t) => t.clear())}>
        Clear
      </button>
      <button type="button" onClick={() => withTool((t) => t.appendLink())}>
        Link
      </button>
      <button type="button" onClick={() => inputRef.current?.click()}>
        Attach File
      </button>
      <input
        ref={inputRef}
        type="file"
        onChange={(e) =>
          withTool((t) => {
            const files = Array.from(e.target.files || []);

            t.attachFile(files);
          })
        }
        style={{
          display: "none",
        }}
      />
      <button
        type="button"
        onClick={() =>
          withTool((t) => {
            t.toggleBlockType("heading", {
              level: 1,
            });
          })
        }
      >
        H1
      </button>
      <button
        type="button"
        onClick={() =>
          withTool((t) => {
            t.wrapInList("ordered_list");
          })
        }
      >
        Ordered List
      </button>
      <button
        type="button"
        onClick={() =>
          withTool((t) => {
            t.wrapInList("bullet_list");
          })
        }
      >
        Bullet List
      </button>
      <button
        type="button"
        onClick={() =>
          withTool((t) => {
            t.setBlockType("code_block");
          })
        }
      >
        Code Block
      </button>
    </div>
  );
}
