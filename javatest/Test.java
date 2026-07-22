import java.util.*;
import java.util.stream.Collectors;


public class Main {
    public static int[] parseIntArray(String s) {
        s = s.replaceAll("[\\[\\]\\s]", "");
        if (s.isEmpty()) return new int[0];
        String[] parts = s.split(",");
        int[] res = new int[parts.length];
        for (int i = 0; i < parts.length; i++) res[i] = Integer.parseInt(parts[i]);
        return res;
    }
    public static String[] parseStringArray(String s) {
        s = s.replaceAll("[\\[\\]\\s]", "");
        if (s.isEmpty()) return new String[0];
        return s.split(",");
    }
    public static List<Integer> parseIntList(String s) {
        List<Integer> list = new ArrayList<>();
        if (s == null || s.isEmpty()) return list;
        s = s.replaceAll("[\\[\\]\\s]", "");
        if (s.isEmpty()) return list;
        String[] parts = s.split(",");
        for (String p : parts) list.add(Integer.parseInt(p));
        return list;
    }
    public static List<String> parseStringList(String s) {
        List<String> list = new ArrayList<>();
        if (s == null || s.isEmpty()) return list;
        s = s.replaceAll("[\\[\\]\\s]", "");
        if (s.isEmpty()) return list;
        String[] parts = s.split(",");
        for (String p : parts) if (!p.isEmpty()) list.add(p);
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
            String row = outer[i].replaceAll("[\\[\\]\\s]", "");
            if (row.isEmpty()) { res[i] = new int[0]; continue; }
            String[] parts = row.split(",");
            int[] r = new int[parts.length];
            for (int j = 0; j < parts.length; j++) r[j] = Integer.parseInt(parts[j]);
            res[i] = r;
        }
        return res;
    }
    public static String toString(Object o) {
        if (o == null) return "null";
        if (o instanceof int[]) return java.util.Arrays.toString((int[]) o);
        if (o instanceof String[]) return java.util.Arrays.toString((String[]) o);
        if (o instanceof Object[]) return java.util.Arrays.toString((Object[]) o);
        if (o instanceof java.util.List) return o.toString();
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

        int[] nums = parseIntArray(lines[0]);
        int target = Integer.parseInt(lines[1]);
        Solution sol = new Solution();
        System.out.println(Main.toString(sol.twoSum(nums, target)));
    }
}
class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0,1}; } }