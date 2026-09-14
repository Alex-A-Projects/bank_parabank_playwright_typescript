import java.sql.*;
import java.math.BigDecimal;

/**
 * DbQuery - Swiss-army-knife CLI for reading ParaBank's HSQLDB.
 *
 * Usage: java -cp <classpath> DbQuery <mode> [args...]
 *
 * Output contract (used by dbClient.ts):
 *   - Single-row, multi-column results: pipe-delimited fields, one row per line.
 *   - Scalar results (counts, sums): just the value on a single line.
 *   - Empty result sets: empty stdout. Callers must handle "no rows".
 *
 * The pipe ("") and newline conventions match the existing
 * getCustomerByUsername helper - keep that contract stable.
 */
public class DbQuery {

    private static final String URL = "jdbc:hsqldb:hsql://localhost:9001/parabank";
    private static final String USER = "sa";
    private static final String PASS = "";

    public static void main(String[] args) throws Exception {
        if (args.length == 0) {
            System.out.println("Usage: DbQuery <mode> [args]");
            return;
        }

        String mode = args[0];

        Connection conn = DriverManager.getConnection(URL, USER, PASS);
        try {
            switch (mode) {
                // ---- CUSTOMER ----
                case "customer-by-username":       queryCustomerByUsername(conn, args); break;
                case "customer-by-id":             queryCustomerById(conn, args); break;
                case "customer-count":             scalarQuery(conn, "SELECT COUNT(*) FROM CUSTOMER"); break;
                case "customer-exists-username":   existsQuery(conn,
                                                          "SELECT 1 FROM CUSTOMER WHERE USERNAME = ?", args); break;

                // ---- ACCOUNT ----
                case "account-by-id":              queryAccountById(conn, args); break;
                case "accounts-by-customer":       queryAccountsByCustomer(conn, args); break;
                case "account-count-by-customer":  scalarParamQuery(conn,
                                                          "SELECT COUNT(*) FROM ACCOUNT WHERE CUSTOMER_ID = ?",
                                                          args); break;
                case "account-balance":            scalarParamQuery(conn,
                                                          "SELECT BALANCE FROM ACCOUNT WHERE ID = ?",
                                                          args); break;

                // ---- TRANSACTION ----
                case "transaction-by-id":          queryTransactionById(conn, args); break;
                case "transactions-by-account":    queryTransactionsByAccount(conn, args); break;
                case "transactions-by-customer":   queryTransactionsByCustomer(conn, args); break;
                case "transaction-count-by-account":  scalarParamQuery(conn,
                                                          "SELECT COUNT(*) FROM TRANSACTION WHERE ACCOUNT_ID = ?",
                                                          args); break;
                case "transaction-count-by-customer": scalarParamQuery(conn,
                                                          "SELECT COUNT(*) FROM TRANSACTION WHERE ACCOUNT_ID IN (SELECT ID FROM ACCOUNT WHERE CUSTOMER_ID = ?)",
                                                          args); break;
                case "transfer-exists":            existsQuery(conn,
                                                          "SELECT 1 FROM TRANSACTION WHERE ACCOUNT_ID = ? AND DESCRIPTION LIKE 'Funds Transfer%' AND AMOUNT = ?",
                                                          args); break;
                case "loan-payment-exists":        existsQuery(conn,
                                                          "SELECT 1 FROM TRANSACTION WHERE ACCOUNT_ID = ? AND DESCRIPTION LIKE 'Down Payment for Loan%' AND AMOUNT = ?",
                                                          args); break;
                case "loan-account-exists":        existsQuery(conn,
                                                          "SELECT 1 FROM ACCOUNT WHERE CUSTOMER_ID = ? AND TYPE = 2 AND BALANCE = ?",
                                                          args); break;
                case "loan-accounts-by-customer":  scalarParamQuery(conn,
                                                          "SELECT COUNT(*) FROM ACCOUNT WHERE CUSTOMER_ID = ? AND TYPE = 2",
                                                          args); break;

                default:
                    System.out.println("Unknown mode: " + mode);
            }
        } finally {
            conn.close();
        }
    }

    // ---------------- CUSTOMER ----------------

    private static void queryCustomerByUsername(Connection conn, String[] args) throws SQLException {
        requireArg(args, 1, "username");
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ID, FIRST_NAME, LAST_NAME, ADDRESS, CITY, STATE, ZIP_CODE, PHONE_NUMBER, USERNAME " +
                "FROM CUSTOMER WHERE USERNAME = ?")) {
            ps.setString(1, args[1]);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) printRow(rs, 9);
            }
        }
    }

    private static void queryCustomerById(Connection conn, String[] args) throws SQLException {
        requireArg(args, 1, "customerId");
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ID, FIRST_NAME, LAST_NAME, ADDRESS, CITY, STATE, ZIP_CODE, PHONE_NUMBER, USERNAME " +
                "FROM CUSTOMER WHERE ID = ?")) {
            ps.setInt(1, Integer.parseInt(args[1]));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) printRow(rs, 9);
            }
        }
    }

    // ---------------- ACCOUNT ----------------

    private static void queryAccountById(Connection conn, String[] args) throws SQLException {
        requireArg(args, 1, "accountId");
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ID, CUSTOMER_ID, TYPE, BALANCE FROM ACCOUNT WHERE ID = ?")) {
            ps.setInt(1, Integer.parseInt(args[1]));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    System.out.println(
                        rs.getInt("ID") + "|" +
                        rs.getInt("CUSTOMER_ID") + "|" +
                        rs.getInt("TYPE") + "|" +
                        rs.getBigDecimal("BALANCE").toPlainString()
                    );
                }
            }
        }
    }

    private static void queryAccountsByCustomer(Connection conn, String[] args) throws SQLException {
        requireArg(args, 1, "customerId");
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ID, CUSTOMER_ID, TYPE, BALANCE FROM ACCOUNT WHERE CUSTOMER_ID = ? ORDER BY ID")) {
            ps.setInt(1, Integer.parseInt(args[1]));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    System.out.println(
                        rs.getInt("ID") + "|" +
                        rs.getInt("CUSTOMER_ID") + "|" +
                        rs.getInt("TYPE") + "|" +
                        rs.getBigDecimal("BALANCE").toPlainString()
                    );
                }
            }
        }
    }

    // ---------------- TRANSACTION ----------------

    private static void queryTransactionById(Connection conn, String[] args) throws SQLException {
        requireArg(args, 1, "transactionId");
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ID, ACCOUNT_ID, TYPE, DATE, AMOUNT, DESCRIPTION FROM TRANSACTION WHERE ID = ?")) {
            ps.setInt(1, Integer.parseInt(args[1]));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) printRow(rs, 6);
            }
        }
    }

    private static void queryTransactionsByAccount(Connection conn, String[] args) throws SQLException {
        requireArg(args, 1, "accountId");
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ID, ACCOUNT_ID, TYPE, DATE, AMOUNT, DESCRIPTION FROM TRANSACTION WHERE ACCOUNT_ID = ? ORDER BY ID")) {
            ps.setInt(1, Integer.parseInt(args[1]));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) printRow(rs, 6);
            }
        }
    }

    private static void queryTransactionsByCustomer(Connection conn, String[] args) throws SQLException {
        requireArg(args, 1, "customerId");
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT ID, ACCOUNT_ID, TYPE, DATE, AMOUNT, DESCRIPTION " +
                "FROM TRANSACTION WHERE ACCOUNT_ID IN (SELECT ID FROM ACCOUNT WHERE CUSTOMER_ID = ?) " +
                "ORDER BY ID")) {
            ps.setInt(1, Integer.parseInt(args[1]));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) printRow(rs, 6);
            }
        }
    }

    // ---------------- GENERIC HELPERS ----------------

    private static void scalarQuery(Connection conn, String sql) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            if (rs.next()) System.out.println(rs.getString(1));
        }
    }

    /**
     * Executes a prepared scalar query that takes one parameter.
     * args[1] is the parameter value as text; the SQL controls its target column.
     */
    private static void scalarParamQuery(Connection conn, String sql, String[] args) throws SQLException {
        requireArg(args, 1, "param");
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            // We pass through as String; the JDBC driver converts to the target
            // numeric type when the column is numeric. For exact DECIMAL columns
            // this still works because we only use this helper for COUNT(*) and
            // BALANCE lookups where the cast is implicit.
            ps.setString(1, args[1]);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) System.out.println(rs.getString(1));
            }
        }
    }

    /**
     * existsQuery: prints "true" or empty stdout if no row matches.
     * Expects args[1..n] to be the parameter values for the placeholders.
     */
    private static void existsQuery(Connection conn, String sql, String[] args) throws SQLException {
        if (args.length < 2) {
            System.out.println("Usage requires at least one parameter");
            return;
        }
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 1; i < args.length; i++) {
                ps.setString(i, args[i]);
            }
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) System.out.println("true");
            }
        }
    }

    /**
     * Print the first N columns of the current row, pipe-separated, in column order.
     */
    private static void printRow(ResultSet rs, int columns) throws SQLException {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= columns; i++) {
            if (i > 1) sb.append("|");
            String v = rs.getString(i);
            sb.append(v == null ? "" : v);
        }
        System.out.println(sb);
    }

    private static void requireArg(String[] args, int index, String name) {
        if (args.length <= index) {
            System.out.println("Missing argument: " + name);
            throw new IllegalArgumentException("Missing argument: " + name);
        }
    }
}
