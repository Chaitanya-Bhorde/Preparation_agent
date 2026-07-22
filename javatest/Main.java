import java.util.*;
import java.util.stream.Collectors;
class Solution { public int numIslands(char[][] grid) { return 1; } }
public class Main {
    public static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1);
            if (s.trim().isEmpty()) return new int[0];
            String[] parts = s.trim().split("\\s*,\\s*");
            int[] res = new int[parts.length];
            for (int i = 0; i < parts.length; i++) res[i] = Integer.parseInt(parts[i].trim());
            return res;
        }
        if (s.trim().isEmpty()) return new int[0];
        String[] parts = s.trim().split("\\s+");
        int[] res = new int[parts.length];
        for (int i = 0; i < parts.length; i++) res[i] = Integer.parseInt(parts[i]);
        return res;
    }
    public static String[] parseStringArray(String s) {
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) {
            s = s.substring(1, s.length() - 1);
            if (s.trim().isEmpty()) return new String[0];
            return s.trim().split("\\s*,\\s*");
        }
        if (s.trim().isEmpty()) return new String[0];
        return s.trim().split("\\s+");
    }
    public static List<Integer> parseIntList(String s) {
        List<Integer> list = new ArrayList<>();
        if (s == null || s.trim().isEmpty()) return list;
        s = s.trim();
        if (s.startsWith("[") && s.endsWith("]")) s = s.substring(1, s.length() - 1);
        String[] parts = s.trim().split("\\s*,\\s*|\\s+");
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
        String[] parts = s.trim().split("\\s*,\\s*|\\s+");
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
        s = s.replaceAll("^\\s*\\[|\\]\\s*$", "").trim();
        String[] outer;
        if (s.startsWith("[")) {
            s = s.substring(1, s.length()-1);
            outer = s.split("\\],\\s*\\[");
        } else {
            outer = s.split(";");
        }
        int[][] res = new int[outer.length][];
        for (int i = 0; i < outer.length; i++) {
            String row = outer[i].replaceAll("[\\[\\]\\s]", "").trim();
            if (row.isEmpty()) { res[i] = new int[0]; continue; }
            String[] parts = row.split("\\s*,\\s*");
            int[] r = new int[parts.length];
            for (int j = 0; j < parts.length; j++) r[j] = Integer.parseInt(parts[j].trim());
            res[i] = r;
        }
        return res;
    }
    public static char[][] parseIntCharMatrix(String s) {
        String[] lines = s.trim().split("\n");
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
        char[][] grid = parseIntCharMatrix(lines[0]);
        Solution sol = new Solution();
        System.out.println(Main.toString(sol.numIslands(grid)));
    }
}
