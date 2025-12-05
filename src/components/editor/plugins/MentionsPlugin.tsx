import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { TextNode } from "lexical";
import { useCallback, useEffect, useState, useMemo } from "react";
import * as ReactDOM from "react-dom";
import { $createTokenNode } from "../nodes/ScriptNodes";

class MentionOption extends MenuOption {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    super(name);
    this.name = name;
    this.id = id;
  }
}

function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: MentionOption;
}) {
  let className = "item";
  if (isSelected) {
    className += " selected";
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={`cursor-pointer p-2 rounded-md flex items-center gap-2 ${
        isSelected ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-800"
      }`}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={"typeahead-item-" + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">
        {option.name.charAt(0)}
      </div>
      <span className="text-sm font-medium">{option.name}</span>
    </li>
  );
}

export default function MentionsPlugin({ projectId }: { projectId: string }) {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const [characters, setCharacters] = useState<MentionOption[]>([]);

  useEffect(() => {
    // Fetch characters from Vault
    async function fetchCharacters() {
      try {
        // Mock data for now if backend is empty or failing
        // const chars = await invoke("get_characters", { projectId });
        // For demo purposes, let's use a static list + backend fetch attempt
        const mockChars = [
          new MentionOption("Anna", "char:anna"),
          new MentionOption("David", "char:david"),
          new MentionOption("Sarah", "char:sarah"),
        ];
        setCharacters(mockChars);
        
        // Real fetch (uncomment when data exists)
        // const realChars: any[] = await invoke("get_characters", { projectId });
        // if (realChars && realChars.length > 0) {
        //   setCharacters(realChars.map((c) => new MentionOption(c.name, c.id.id.String)));
        // }
      } catch (e) {
        console.error("Failed to fetch characters", e);
      }
    }
    fetchCharacters();
  }, [projectId]);

  // Also support '@'
  const checkForAtMatch = useBasicTypeaheadTriggerMatch("@", {
    minLength: 0,
  });

  const options = useMemo(() => {
    if (!queryString) return characters;
    const regex = new RegExp(queryString, "i");
    return characters.filter((option) => regex.test(option.name));
  }, [characters, queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: MentionOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const tokenNode = $createTokenNode(selectedOption.name, selectedOption.id);
        if (nodeToReplace) {
          nodeToReplace.replace(tokenNode);
        }
        tokenNode.select();
        closeMenu();
      });
    },
    [editor]
  );

  const checkForMatch = useCallback(
    (text: string) => {
      const atMatch = checkForAtMatch(text, editor);
      if (atMatch) return atMatch;
      // const slashMatch = checkForMentionMatch(text, editor);
      // if (slashMatch) return slashMatch;
      return null;
    },
    [checkForAtMatch, editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        if (anchorElementRef.current && options.length === 0) {
          return null;
        }

        return anchorElementRef.current
          ? ReactDOM.createPortal(
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl p-1 min-w-[200px] z-50">
                <ul className="max-h-[200px] overflow-y-auto">
                  {options.map((option, i) => (
                    <MentionsTypeaheadMenuItem
                      index={i}
                      isSelected={selectedIndex === i}
                      onClick={() => {
                        setHighlightedIndex(i);
                        selectOptionAndCleanUp(option);
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(i);
                      }}
                      key={option.key}
                      option={option}
                    />
                  ))}
                </ul>
              </div>,
              anchorElementRef.current
            )
          : null;
      }}
    />
  );
}
