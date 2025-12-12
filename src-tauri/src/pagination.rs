use serde::{Deserialize, Serialize};

// Constants mirroring the industry constraints (Courier Prime 12pt @ 72dpi equivalent)
// 10 chars per inch. 6 lines per inch.
const LINES_PER_PAGE: usize = 54;
// const PAGE_WIDTH_CHARS: usize = 60; // Standard Action width roughly (unused)

// Element Margins/Widths (in characters, based on left-margin + width)
// Simplification: We only care about the max characters per line for wrapping.
const ACTION_WIDTH: usize = 60;
const DIALOGUE_WIDTH: usize = 35;
const PARENTHETICAL_WIDTH: usize = 20; // 2.0" width strict
const CHARACTER_WIDTH: usize = 38;
const TRANSITION_WIDTH: usize = 15; // Right aligned usually, but width constraint applies

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ScriptElement {
    pub r#type: String, // "action", "dialogue", "parenthetical", etc.
    pub text: String,
    pub scene_number: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PageBreak {
    pub line_index: usize, // Index in the list of calculated lines where the break occurs
    pub page_number: usize,
    pub scene_split: bool, // If a scene was split across pages
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PaginationResult {
    pub pages: Vec<PageBreak>,
    pub total_pages: usize,
}

pub fn calculate_lines_for_element(element: &ScriptElement) -> usize {
    let width = match element.r#type.as_str() {
        "dialogue" => DIALOGUE_WIDTH,
        "parenthetical" => PARENTHETICAL_WIDTH,
        "character" => CHARACTER_WIDTH,
        "transition" => TRANSITION_WIDTH,
        _ => ACTION_WIDTH,
    };

    // Strict wrapping logic
    // We treat newlines in text as forced breaks

    // We also need to add top-margin based on element type (e.g. Dialogue has 0 if prev is Character, etc.)
    // But this function just calculates the "visual height" of the element itself text-wise.
    // The spacer logic will handle the gaps between elements.

    // Textwrap is great, but we want strict character count wrapping for Courier.
    // textwrap::wrap uses sophisticated algos, but basic is fine.
    let wrapped = textwrap::wrap(element.text.as_str(), width);
    let mut total_lines = wrapped.len();

    // Ensure at least 1 line if empty?
    if total_lines == 0 {
        total_lines = 1;
    }

    total_lines
}

pub fn paginate_script(elements: Vec<ScriptElement>) -> PaginationResult {
    let mut current_line = 0;
    let mut current_page = 1;
    let mut page_breaks = Vec::new();

    // Basic heuristic:
    // Page 1 starts at line 1.
    // We break at line 54.

    let mut prev_type = "";

    for (i, element) in elements.iter().enumerate() {
        // 1. Calculate spacing before this element
        let mut spacing = 1; // Default double space (1 empty line)
        if i == 0 {
            spacing = 0;
        } // Top of script

        // Compact rules
        if prev_type == "character" && element.r#type == "dialogue" {
            spacing = 0;
        }
        if prev_type == "dialogue" && element.r#type == "parenthetical" {
            spacing = 0;
        }
        if prev_type == "parenthetical" && element.r#type == "dialogue" {
            spacing = 0;
        }

        // Apply spacing
        current_line += spacing;

        // Check for page break during spacing
        if current_line >= LINES_PER_PAGE {
            current_page += 1;
            current_line = 0; // Reset to top
            page_breaks.push(PageBreak {
                line_index: i, // Roughly breaking before this element
                page_number: current_page,
                scene_split: false,
            });
        }

        // 2. Calculate element height
        let lines = calculate_lines_for_element(element);

        // Check if element fits
        if current_line + lines > LINES_PER_PAGE {
            // Element doesn't fit mostly.
            // Rule: Scene Headers should NOT be at the very bottom (orphan).
            // Rule: Character names should NOT be at the bottom without dialogue.

            // Force break
            current_page += 1;
            current_line = lines; // Starts fresh on next page
            page_breaks.push(PageBreak {
                line_index: i,
                page_number: current_page,
                scene_split: false, // simplified
            });
        } else {
            current_line += lines;
        }

        prev_type = &element.r#type;
    }

    PaginationResult {
        pages: page_breaks,
        total_pages: current_page,
    }
}
