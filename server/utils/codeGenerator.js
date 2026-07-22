function generateStarterCode(signature, language) {
  if (!signature) return getDefaultStub(language);
  const { name, params, returnType } = signature;
  switch (language) {
    case 'javascript':
      return generateJSStarter(name, params);
    case 'python':
      return generatePythonStarter(name, params, returnType);
    case 'java':
      return generateJavaStarter(name, params, returnType);
    case 'cpp':
      return generateCppStarter(name, params, returnType);
    case 'c':
      return generateCStarter(name, params, returnType);
    default:
      return getDefaultStub(language);
  }
}

function generateJSStarter(name, params) {
  const paramList = params.map(p => p.name).join(', ');
  return `function ${name}(${paramList}) {\n    \n}\n`;
}

function generatePythonStarter(name, params, returnType) {
  const paramList = params.map(p => p.name).join(', ');
  const hint = returnType === 'bool' ? '    # return True/False' : returnType === 'List[int]' || returnType === 'List[str]' ? '    # return []' : '';
  return `def ${name}(${paramList}):\n${hint}\n    pass\n`;
}

function generateJavaStarter(name, params, returnType) {
  const javaTypeMap = {
    'int': 'int', 'long': 'long', 'double': 'double', 'boolean': 'boolean',
    'String': 'String', 'int[]': 'int[]', 'String[]': 'String[]',
    'List<Integer>': 'java.util.List<Integer>', 'List<String>': 'java.util.List<String>',
    'int[][]': 'int[][]', 'char[][]': 'char[][]',
  };
  const rt = javaTypeMap[returnType] || returnType;
  const paramList = params.map(p => `${mapJavaType(p.type)} ${p.name}`).join(', ');
  return `class Solution {\n    public ${rt} ${name}(${paramList}) {\n        \n    }\n}\n`;
}

function generateCppStarter(name, params, returnType) {
  const cppTypeMap = {
    'int': 'int', 'long': 'long long', 'double': 'double', 'bool': 'bool',
    'string': 'std::string', 'vector<int>': 'std::vector<int>',
    'vector<string>': 'std::vector<std::string>',
    'vector<vector<int>>': 'std::vector<std::vector<int>>',
  };
  const rt = cppTypeMap[returnType] || returnType;
  const paramList = params.map(p => `${mapCppType(p.type)} ${p.name}`).join(', ');
  return `class Solution {\npublic:\n    ${rt} ${name}(${paramList}) {\n        \n    }\n};\n`;
}

function generateCStarter(name, params, returnType) {
  const paramList = params.map(p => `${mapCType(p.type)} ${p.name}`).join(', ');
  return `${mapCType(returnType)} ${name}(${paramList}) {\n    \n}\n`;
}

function mapJavaType(type) {
  const map = {
    'int': 'int', 'long': 'long', 'double': 'double', 'boolean': 'boolean',
    'String': 'String', 'int[]': 'int[]', 'String[]': 'String[]',
    'int[][]': 'int[][]', 'char[][]': 'char[][]',
    'List<Integer>': 'java.util.List<Integer>', 'List<String>': 'java.util.List<String>',
    'ListNode': 'ListNode', 'TreeNode': 'TreeNode',
  };
  return map[type] || type;
}

function mapCppType(type) {
  const map = {
    'int': 'int', 'long': 'long long', 'double': 'double', 'bool': 'bool',
    'string': 'std::string', 'vector<int>': 'std::vector<int>',
    'vector<string>': 'std::vector<std::string>',
    'vector<vector<int>>': 'std::vector<std::vector<int>>',
    'ListNode*': 'ListNode*', 'TreeNode*': 'TreeNode*',
  };
  return map[type] || type;
}

function mapCType(type) {
  const map = {
    'int': 'int', 'long': 'long', 'double': 'double', 'char': 'char',
    'char*': 'char*', 'int*': 'int*',
  };
  return map[type] || type;
}

function getDefaultStub(language) {
  const stubs = {
    javascript: 'function solve() {\n    \n}\n',
    python: 'def solve():\n    pass\n',
    java: 'class Solution {\n    public static void solve() {\n        \n    }\n}\n',
    cpp: 'class Solution {\npublic:\n    void solve() {\n        \n    }\n};\n',
    c: 'void solve() {\n    \n}\n',
  };
  return stubs[language] || stubs.javascript;
}

function buildFullSubmissionCode(userCode, signature, testCases, language) {
  if (!signature || !testCases || testCases.length === 0) {
    return userCode || '';
  }
  const funcName = signature.name;
  const params = signature.params || [];
  const returnType = signature.returnType || '';

  switch (language) {
    case 'java':
      return buildJavaDriver(userCode, funcName, params, returnType);
    case 'cpp':
      return buildCppDriver(userCode, funcName, params, returnType);
    case 'python':
      return buildPythonDriver(userCode, funcName, params, returnType);
    case 'javascript':
      return buildJsDriver(userCode, funcName, params, returnType);
    case 'c':
      return buildCDriver(userCode, funcName, params, returnType);
    default:
      return userCode || '';
  }
}

function buildJavaDriver(userCode, funcName, params, returnType) {
  const importsBlock = `import java.util.*;
import java.util.stream.Collectors;
`;

  const argDecls = [];
  for (let i = 0; i < params.length; i++) {
    argDecls.push(`        ${javaParseDecl(params[i].type, params[i].name, i)}`);
  }

  const invoke = `sol.${funcName}(${params.map(p => p.name).join(', ')})`;
  const printExpr = returnType === 'void' ? '' : '        System.out.println(Main.toString(' + invoke + '));';

  const driver = `
public class Main {
    public static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1);
            if (s.trim().isEmpty()) return new int[0];
            String[] parts = s.trim().split("\\\\s*,\\\\s*");
            int[] res = new int[parts.length];
            for (int i = 0; i < parts.length; i++) res[i] = Integer.parseInt(parts[i].trim());
            return res;
        }
        if (s.trim().isEmpty()) return new int[0];
        String[] parts = s.trim().split("\\\\s+");
        int[] res = new int[parts.length];
        for (int i = 0; i < parts.length; i++) res[i] = Integer.parseInt(parts[i]);
        return res;
    }
    public static String[] parseStringArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1);
            if (s.trim().isEmpty()) return new String[0];
            return s.trim().split("\\\\s*,\\\\s*");
        }
        if (s.trim().isEmpty()) return new String[0];
        return s.trim().split("\\\\s+");
    }
    public static List<Integer> parseIntList(String s) {
        List<Integer> list = new ArrayList<>();
        if (s == null || s.trim().isEmpty()) return list;
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) s = s.substring(1, s.length() - 1);
        String[] parts = s.trim().split("\\\\s*,\\\\s*|\\\\s+");
        for (String p : parts) {
            p = p.trim();
            if (!p.isEmpty()) list.add(Integer.parseInt(p));
        }
        return list;
    }
    public static List<String> parseStringList(String s) {
        List<String> list = new ArrayList<>();
        if (s == null || s.trim().isEmpty()) return list;
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) s = s.substring(1, s.length() - 1);
        String[] parts = s.trim().split("\\\\s*,\\\\s*|\\\\s+");
        for (String p : parts) {
            p = p.trim();
            if (!p.isEmpty()) list.add(p);
        }
        return list;
    }
    public static int[][] parseIntMatrix(String s) {
        s = s.trim();
        if (s.startsWith("[") && !s.startsWith("[[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1);
        }
        s = s.replaceAll("^\\\\s*\\\\[|\\\\]\\\\s*$", "").trim();
        String[] outer;
        if (s.startsWith("[")) {
            s = s.substring(1, s.length()-1);
            outer = s.split("\\\\],\\\\s*\\\\[");
        } else {
            outer = s.split(";");
        }
        int[][] res = new int[outer.length][];
        for (int i = 0; i < outer.length; i++) {
            String row = outer[i].replaceAll("[\\\\[\\\\]\\\\s]", "").trim();
            if (row.isEmpty()) { res[i] = new int[0]; continue; }
            String[] parts = row.split("\\\\s*,\\\\s*");
            int[] r = new int[parts.length];
            for (int j = 0; j < parts.length; j++) r[j] = Integer.parseInt(parts[j].trim());
            res[i] = r;
        }
        return res;
    }
    public static char[][] parseIntCharMatrix(String s) {
        String[] lines = s.trim().split("\\n");
        char[][] res = new char[lines.length][];
        for (int i = 0; i < lines.length; i++) {
            res[i] = lines[i].trim().toCharArray();
        }
        return res;
    }
    public static String toString(Object o) {
        if (o == null) return "null";
        if (o instanceof int[]) {
            int[] arr = (int[]) o;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(" ");
                sb.append(arr[i]);
            }
            return sb.toString();
        }
        if (o instanceof String[]) {
            String[] arr = (String[]) o;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(" ");
                sb.append(arr[i]);
            }
            return sb.toString();
        }
        if (o instanceof Object[]) {
            Object[] arr = (Object[]) o;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < arr.length; i++) {
                if (i > 0) sb.append(" ");
                sb.append(arr[i]);
            }
            return sb.toString();
        }
        if (o instanceof java.util.List) {
            java.util.List<?> list = (java.util.List<?>) o;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(" ");
                sb.append(list.get(i));
            }
            return sb.toString();
        }
        return String.valueOf(o);
    }

    public static void main(String[] args) throws Exception {
        java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(System.in));
        List<String> lineList = new ArrayList<>();
        String l;
        while ((l = br.readLine()) != null) {
            l = l.trim();
            if (!l.isEmpty()) lineList.add(l);
        }
        String[] lines = lineList.toArray(new String[0]);
${argDecls.join('\n')}
        Solution sol = new Solution();
${printExpr}
    }
}
`;

  return `${importsBlock}${userCode}${driver}`;
}

function javaParseDecl(type, name, idx) {
  const raw = `lines[${idx}]`;
  if (type === 'int[]') return 'int[] ' + name + ' = parseIntArray(' + raw + ');';
  if (type === 'String[]') return 'String[] ' + name + ' = parseStringArray(' + raw + ');';
  if (type === 'List<Integer>') return 'List<Integer> ' + name + ' = parseIntList(' + raw + ');';
  if (type === 'List<String>') return 'List<String> ' + name + ' = parseStringList(' + raw + ');';
  if (type === 'int[][]') return 'int[][] ' + name + ' = parseIntMatrix(' + raw + ');';
  if (type === 'char[][]') return 'char[][] ' + name + ' = parseIntCharMatrix(' + raw + ');';
  if (type === 'boolean') return 'boolean ' + name + ' = Boolean.parseBoolean(' + raw + ');';
  if (type === 'double') return 'double ' + name + ' = Double.parseDouble(' + raw + ');';
  if (type === 'long') return 'long ' + name + ' = Long.parseLong(' + raw + ');';
  if (type === 'String') return 'String ' + name + ' = ' + raw + ';';
  if (type === 'int') return 'int ' + name + ' = Integer.parseInt(' + raw + ');';
  return '/* raw */ String ' + name + 'Raw = ' + raw + ';';
}

function buildCppDriver(userCode, funcName, params, returnType) {
  const parsing = params.map((p, i) => cppParseLine(p, i)).join('\n    ');
  const args = params.map(p => p.name).join(', ');
  const invoke = `s.${funcName}(${args})`;
  const printExpr = cppPrintExpr('result', returnType);

  return `#include <bits/stdc++.h>
using namespace std;

${userCode}

template<typename T>
string to_string_helper(const T& v) { return to_string(v); }

string to_string_helper(const vector<int>& v) {
    if (v.empty()) return "";
    string s = to_string(v[0]);
    for (size_t i = 1; i < v.size(); ++i) s += " " + to_string(v[i]);
    return s;
}

string to_string_helper(const vector<string>& v) {
    if (v.empty()) return "";
    string s = v[0];
    for (size_t i = 1; i < v.size(); ++i) s += " " + v[i];
    return s;
}

string to_string_helper(const vector<vector<int>>& vv) {
    if (vv.empty()) return "";
    string s = "[";
    for (size_t i = 0; i < vv.size(); ++i) {
        if (i) s += ",";
        s += "[";
        for (size_t j = 0; j < vv[i].size(); ++j) {
            if (j) s += ",";
            s += to_string(vv[i][j]);
        }
        s += "]";
    }
    return s + "]";
}

vector<int> parseIntVector(const string& s) {
    string t = s;
    t.erase(remove_if(t.begin(), t.end(), [](char c){ return c=='['||c==']'||c==','; }), t.end());
    if (t.empty()) return {};
    stringstream ss(t);
    vector<int> v;
    int item;
    while (ss >> item) v.push_back(item);
    return v;
}

vector<string> parseStringVector(const string& s) {
    string t = s;
    t.erase(remove_if(t.begin(), t.end(), [](char c){ return c=='['||c==']'||c==','; }), t.end());
    if (t.empty()) return {};
    stringstream ss(t);
    vector<string> v;
    string item;
    while (ss >> item) v.push_back(item);
    return v;
}

vector<vector<int>> parseIntMatrix(const string& s) {
    string t = s;
    auto isDigit = [](char c){ return c=='['||c==']'||c==','||c==' '||(c>='0'&&c<='9'); };
    t.erase(remove_if(t.begin(), t.end(), [&](char c){ return !isDigit(c); }), t.end());
    if (t.empty()) return {};
    stringstream ss(t);
    vector<vector<int>> res;
    string row;
    while (getline(ss, row, ';')) {
        stringstream rowss(row);
        vector<int> r;
        int val;
        while (rowss >> val) r.push_back(val);
        res.push_back(r);
    }
    return res;
}

vector<string> readAllLines() {
    vector<string> lines;
    string line;
    while (getline(cin, line)) {
        lines.push_back(line);
    }
    return lines;
}

int main() {
    vector<string> lines = readAllLines();
    int idx = 0;
    ${parsing}
    Solution s;
    auto result = ${invoke};
    cout << ${printExpr} << endl;
    return 0;
}
`;
}

function cppParseLine(p, idx) {
  const name = p.name;
  if (p.type === 'int') return `int ${name} = stoi(lines[${idx}]);`;
  if (p.type === 'long') return `long long ${name} = stoll(lines[${idx}]);`;
  if (p.type === 'double') return `double ${name} = stod(lines[${idx}]);`;
  if (p.type === 'bool') return `bool ${name} = lines[${idx}] == "true";`;
  if (p.type === 'string') return `string ${name} = lines[${idx}];`;
  if (p.type === 'vector<int>') return `vector<int> ${name} = parseIntVector(lines[${idx}]);`;
  if (p.type === 'vector<string>') return `vector<string> ${name} = parseStringVector(lines[${idx}]);`;
  if (p.type === 'vector<vector<int>>') return `vector<vector<int>> ${name} = parseIntMatrix(lines[${idx}]);`;
  return `/* TODO: ${p.type} */ string ${name}_raw = lines[${idx}];`;
}

function cppPrintExpr(varName, type) {
  if (type === 'vector<int>') return `to_string_helper(${varName})`;
  if (type === 'vector<string>') return `to_string_helper(${varName})`;
  if (type === 'vector<vector<int>>') return `to_string_helper(${varName})`;
  return `to_string_helper(${varName})`;
}

function buildPythonDriver(userCode, funcName, params, returnType) {
  const parsing = params.map((p) => pythonParseLine(p)).join('\n');
  const args = params.map(p => p.name).join(', ');

  return `import sys, ast
from typing import List

input_data = sys.stdin.read()
lines = [line.strip() for line in input_data.split('\\n') if line.strip() != '']
${parsing}
result = ${funcName}(${args})
if result is not None:
    if isinstance(result, list):
        print(' '.join(map(str, result)))
    else:
        print(result)
`;
}

function pythonParseLine(p) {
  const ln = `lines.pop(0) if lines else ''`;
  if (p.type === 'int') return `${p.name} = int(${ln})`;
  if (p.type === 'long') return `${p.name} = int(${ln})`;
  if (p.type === 'double') return `${p.name} = float(${ln})`;
  if (p.type === 'bool') return `${p.name} = (${ln}).lower() == 'true'`;
  if (p.type === 'string' || p.type === 'String') return `${p.name} = ${ln}`;
  if (p.type === 'List[int]' || p.type === 'int[]' || p.type === 'List[List[int]]') return `${p.name} = list(map(int, ${ln}.split()))`;
  if (p.type === 'List[str]' || p.type === 'String[]') return `${p.name} = ${ln}.split()`;
  return `${p.name} = ${ln}  # raw`;
}

function buildJsDriver(userCode, funcName, params, returnType) {
  const parsing = params.map((p) => jsParseLine(p)).join('\n');
  const args = params.map(p => p.name).join(', ');

  return `const fs = require('fs');
${userCode}
const input = fs.readFileSync(0, 'utf-8').trim();
const lines = input.split('\\n').filter(line => line.trim() !== '');
${parsing}
const result = ${funcName}(${args});
if (Array.isArray(result)) {
    console.log(result.join(' '));
} else if (result !== undefined && result !== null) {
    console.log(result);
}
`;
}

function jsParseLine(p) {
  const ln = `lines.shift()`;
  if (p.type === 'int') return `const ${p.name} = parseInt(${ln}, 10);`;
  if (p.type === 'long') return `const ${p.name} = parseInt(${ln}, 10);`;
  if (p.type === 'double') return `const ${p.name} = parseFloat(${ln});`;
  if (p.type === 'boolean') return `const ${p.name} = ${ln}.toLowerCase() === 'true';`;
  if (p.type === 'string') return `const ${p.name} = ${ln};`;
  if (p.type === 'int[]' || p.type === 'number[]') return `const ${p.name} = ${ln}.trim().split(/\\s+/).map(Number);`;
  if (p.type === 'string[]') return `const ${p.name} = ${ln}.trim().split(/\\s+/);`;
  return `const ${p.name} = ${ln};`;
}

function buildCDriver(userCode, funcName, params, returnType) {
  const parsing = params.map((p, idx) => cParseLine(p, idx)).join('\n    ');
  const args = params.map(p => p.name).join(', ');
  const printExpr = cPrintExpr('result', returnType);

  return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char** splitLines(char* input, int* count) {
    int caps = 4, n = 0;
    char** arr = malloc(sizeof(char*) * caps);
    char* save = NULL;
    char* token = strtok_r(input, "\\n", &save);
    while (token) {
        if (n >= caps) { caps *= 2; arr = realloc(arr, sizeof(char*) * caps); }
        arr[n++] = token;
        token = strtok_r(NULL, "\\n", &save);
    }
    *count = n;
    return arr;
}

int main() {
    char buffer[4096];
    if (!fgets(buffer, sizeof(buffer), stdin)) return 0;
    int count = 0;
    char** lines = splitLines(buffer, &count);
    if (count == 0) return 0;
    ${parsing}
    ${returnType} result = ${funcName}(${args});
    ${printExpr}
    return 0;
}
`;
}

function cParseLine(p, idx) {
  if (p.type === 'int') return `int ${p.name} = atoi(lines[${idx}]);`;
  if (p.type === 'long') return `long long ${p.name} = atoll(lines[${idx}]);`;
  if (p.type === 'double') return `double ${p.name} = atof(lines[${idx}]);`;
  if (p.type === 'char*') return `char* ${p.name} = strdup(lines[${idx}]);`;
  return `char* ${p.name} = strdup(lines[${idx}]);`;
}

function cPrintExpr(varName, type) {
  if (type === 'int') return `printf("%d\\n", ${varName});`;
  if (type === 'long') return `printf("%lld\\n", ${varName});`;
  if (type === 'double') return `printf("%f\\n", ${varName});`;
  if (type === 'boolean') return `printf("%s\\n", ${varName} ? "true" : "false");`;
  if (type === 'char*' || type === 'string') return `printf("%s\\n", ${varName});`;
  return ``;
}

function validateSignatureAgainstTestCases(signature, testCases) {
  if (!signature || !testCases || testCases.length === 0) return { valid: true };
  return { valid: true };
}

module.exports = {
  generateStarterCode,
  buildFullSubmissionCode,
  validateSignatureAgainstTestCases,
};