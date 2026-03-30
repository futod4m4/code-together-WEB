import * as monaco from "monaco-editor";

const goKeywords = [
  "break", "case", "chan", "const", "continue", "default", "defer", "else",
  "fallthrough", "for", "func", "go", "goto", "if", "import", "interface",
  "map", "package", "range", "return", "select", "struct", "switch", "type", "var",
  "append", "cap", "close", "complex", "copy", "delete", "imag", "len", "make",
  "new", "panic", "print", "println", "real", "recover",
  "bool", "byte", "complex64", "complex128", "error", "float32", "float64",
  "int", "int8", "int16", "int32", "int64", "rune", "string",
  "uint", "uint8", "uint16", "uint32", "uint64", "uintptr",
  "true", "false", "nil", "iota",
];

const goSnippets = [
  { label: "func", insertText: "func ${1:name}(${2:params}) ${3:returnType} {\n\t$0\n}", detail: "Function" },
  { label: "fmain", insertText: "func main() {\n\t$0\n}", detail: "Main function" },
  { label: "ife", insertText: "if err != nil {\n\t${1:return err}\n}", detail: "Error check" },
  { label: "for", insertText: "for ${1:i} := ${2:0}; ${1:i} < ${3:n}; ${1:i}++ {\n\t$0\n}", detail: "For loop" },
  { label: "forr", insertText: "for ${1:i}, ${2:v} := range ${3:collection} {\n\t$0\n}", detail: "Range loop" },
  { label: "struct", insertText: "type ${1:Name} struct {\n\t${2:Field} ${3:Type}\n}", detail: "Struct" },
  { label: "iface", insertText: "type ${1:Name} interface {\n\t${2:Method}(${3:params}) ${4:return}\n}", detail: "Interface" },
  { label: "switch", insertText: "switch ${1:expr} {\ncase ${2:val}:\n\t$0\ndefault:\n}", detail: "Switch" },
  { label: "gofunc", insertText: "go func() {\n\t$0\n}()", detail: "Goroutine" },
  { label: "test", insertText: "func Test${1:Name}(t *testing.T) {\n\t$0\n}", detail: "Test function" },
  { label: "imp", insertText: "import (\n\t\"${1:fmt}\"\n)", detail: "Import block" },
];

const pythonKeywords = [
  "False", "None", "True", "and", "as", "assert", "async", "await",
  "break", "class", "continue", "def", "del", "elif", "else", "except",
  "finally", "for", "from", "global", "if", "import", "in", "is",
  "lambda", "nonlocal", "not", "or", "pass", "raise", "return",
  "try", "while", "with", "yield",
  "print", "len", "range", "enumerate", "zip", "map", "filter",
  "int", "str", "float", "list", "dict", "set", "tuple", "bool",
  "isinstance", "type", "input", "open", "super", "property",
  "staticmethod", "classmethod", "abs", "max", "min", "sum", "sorted",
];

const pythonSnippets = [
  { label: "def", insertText: "def ${1:name}(${2:params}):\n\t${3:pass}", detail: "Function" },
  { label: "class", insertText: "class ${1:Name}:\n\tdef __init__(self${2:, params}):\n\t\t${3:pass}", detail: "Class" },
  { label: "ifmain", insertText: 'if __name__ == "__main__":\n\t${1:main()}', detail: "Main guard" },
  { label: "for", insertText: "for ${1:item} in ${2:iterable}:\n\t$0", detail: "For loop" },
  { label: "with", insertText: 'with open("${1:file}", "${2:r}") as ${3:f}:\n\t$0', detail: "With/open" },
  { label: "try", insertText: "try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}", detail: "Try/except" },
  { label: "lambda", insertText: "lambda ${1:x}: ${2:x}", detail: "Lambda" },
  { label: "list_comp", insertText: "[${1:x} for ${1:x} in ${2:iterable}]", detail: "List comprehension" },
];

const javaKeywords = [
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "final", "finally", "float", "for", "if", "implements",
  "import", "instanceof", "int", "interface", "long", "native", "new",
  "package", "private", "protected", "public", "return", "short", "static",
  "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "try", "void", "volatile", "while",
  "String", "System", "Integer", "Long", "Double", "Float", "Boolean",
  "ArrayList", "HashMap", "List", "Map", "Set", "Optional",
  "true", "false", "null",
];

const javaSnippets = [
  { label: "psvm", insertText: "public static void main(String[] args) {\n\t$0\n}", detail: "Main method" },
  { label: "sout", insertText: "System.out.println(${1:\"\"});", detail: "Print line" },
  { label: "for", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t$0\n}", detail: "For loop" },
  { label: "foreach", insertText: "for (${1:Type} ${2:item} : ${3:collection}) {\n\t$0\n}", detail: "For-each" },
  { label: "try", insertText: "try {\n\t$0\n} catch (${1:Exception} ${2:e}) {\n\t${3:e.printStackTrace();}\n}", detail: "Try/catch" },
  { label: "class", insertText: "public class ${1:Name} {\n\t$0\n}", detail: "Class" },
];

const rustKeywords = [
  "as", "async", "await", "break", "const", "continue", "crate", "dyn",
  "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in",
  "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return",
  "self", "Self", "static", "struct", "super", "trait", "true", "type",
  "unsafe", "use", "where", "while",
  "i8", "i16", "i32", "i64", "i128", "isize",
  "u8", "u16", "u32", "u64", "u128", "usize",
  "f32", "f64", "bool", "char", "str", "String",
  "Vec", "Box", "Option", "Result", "Some", "None", "Ok", "Err",
  "println", "format", "vec", "todo", "unimplemented", "unreachable",
];

const rustSnippets = [
  { label: "fn", insertText: "fn ${1:name}(${2:params}) -> ${3:ReturnType} {\n\t$0\n}", detail: "Function" },
  { label: "fmain", insertText: "fn main() {\n\t$0\n}", detail: "Main" },
  { label: "struct", insertText: "struct ${1:Name} {\n\t${2:field}: ${3:Type},\n}", detail: "Struct" },
  { label: "impl", insertText: "impl ${1:Name} {\n\t$0\n}", detail: "Impl block" },
  { label: "match", insertText: "match ${1:expr} {\n\t${2:pattern} => ${3:result},\n\t_ => ${4:default},\n}", detail: "Match" },
  { label: "enum", insertText: "enum ${1:Name} {\n\t${2:Variant},\n}", detail: "Enum" },
  { label: "test", insertText: "#[test]\nfn ${1:test_name}() {\n\t$0\n}", detail: "Test" },
];

const phpKeywords = [
  "abstract", "and", "array", "as", "break", "callable", "case", "catch",
  "class", "clone", "const", "continue", "declare", "default", "die", "do",
  "echo", "else", "elseif", "empty", "enddeclare", "endfor", "endforeach",
  "endif", "endswitch", "endwhile", "eval", "exit", "extends", "final",
  "finally", "fn", "for", "foreach", "function", "global", "goto", "if",
  "implements", "include", "instanceof", "interface", "isset", "list",
  "match", "namespace", "new", "null", "or", "print", "private",
  "protected", "public", "readonly", "require", "return", "static",
  "switch", "throw", "trait", "try", "unset", "use", "var", "while",
  "yield", "true", "false",
  "strlen", "strpos", "substr", "array_push", "array_pop", "array_map",
  "array_filter", "count", "in_array", "json_encode", "json_decode",
];

const phpSnippets = [
  { label: "function", insertText: "function ${1:name}(${2:params}) {\n\t$0\n}", detail: "Function" },
  { label: "class", insertText: "class ${1:Name} {\n\tpublic function __construct(${2:params}) {\n\t\t$0\n\t}\n}", detail: "Class" },
  { label: "foreach", insertText: "foreach (\\$${1:array} as \\$${2:key} => \\$${3:value}) {\n\t$0\n}", detail: "Foreach" },
  { label: "try", insertText: "try {\n\t$0\n} catch (\\Exception \\$${1:e}) {\n\t${2:echo \\$e->getMessage();}\n}", detail: "Try/catch" },
];

function createProvider(keywords: string[], snippets: { label: string; insertText: string; detail: string }[]) {
  return {
    provideCompletionItems: (model: monaco.editor.ITextModel, position: monaco.Position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const suggestions: monaco.languages.CompletionItem[] = [
        ...keywords.map((kw) => ({
          label: kw,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw,
          range,
        })),
        ...snippets.map((s) => ({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: s.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: s.detail,
          range,
        })),
      ];
      return { suggestions };
    },
  };
}

let registered = false;

export function registerLanguageCompletions() {
  if (registered) return;
  registered = true;

  monaco.languages.registerCompletionItemProvider("go", createProvider(goKeywords, goSnippets));
  monaco.languages.registerCompletionItemProvider("python", createProvider(pythonKeywords, pythonSnippets));
  monaco.languages.registerCompletionItemProvider("java", createProvider(javaKeywords, javaSnippets));
  monaco.languages.registerCompletionItemProvider("rust", createProvider(rustKeywords, rustSnippets));
  monaco.languages.registerCompletionItemProvider("php", createProvider(phpKeywords, phpSnippets));
}
