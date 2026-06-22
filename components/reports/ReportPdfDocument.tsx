import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

export type ReportPdfData = {
  id: string
  reportNumber: string
  reportTitle: string
  partyName: string
  variety: string
  lotNumber: string
  millName: string
  millOwnerName: string
  analyst: string
  qaApproval: string
  approvedAt: string
  submissionDate: string
  results: {
    name: string
    type: string
    value: string
  }[]
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#16201a",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#d7e5dc",
    paddingBottom: 18,
    marginBottom: 20,
  },
  brand: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: "#0f7a52",
    color: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  companySubline: {
    marginTop: 3,
    color: "#5f6f65",
  },
  reportTitleBlock: {
    alignItems: "flex-end",
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f7a52",
  },
  reportNumber: {
    marginTop: 5,
    color: "#5f6f65",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#0f7a52",
    marginBottom: 8,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#d7e5dc",
  },
  detailCell: {
    width: "50%",
    padding: 9,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
    borderBottomWidth: 1,
    borderBottomColor: "#d7e5dc",
  },
  detailLabel: {
    color: "#5f6f65",
    fontSize: 8,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd9d0",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 28,
    borderBottomWidth: 1,
    borderBottomColor: "#d7e5dc",
  },
  tableHeader: {
    backgroundColor: "#edf6f1",
  },
  fieldCol: {
    width: "52%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
  },
  typeCol: {
    width: "18%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
  },
  valueCol: {
    width: "30%",
    padding: 8,
  },
  headerText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#234133",
    textTransform: "uppercase",
  },
  approvalBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#d7e5dc",
    marginTop: 6,
  },
  approvalCell: {
    width: "50%",
    padding: 10,
    minHeight: 54,
    justifyContent: "space-between",
  },
  approvalDivider: {
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
  },
  signatureLine: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#809289",
    paddingTop: 5,
    color: "#5f6f65",
    fontSize: 8,
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#d7e5dc",
    color: "#7b8981",
    fontSize: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailCell}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "-"}</Text>
    </View>
  )
}

export function ReportPdfDocument({ report }: { report: ReportPdfData }) {
  return (
    <Document title={`${report.reportNumber} - ${report.reportTitle}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text>RML</Text>
            </View>
            <View>
              <Text style={styles.companyName}>Rice Mill Lab</Text>
              <Text style={styles.companySubline}>Quality Analysis Certificate</Text>
            </View>
          </View>
          <View style={styles.reportTitleBlock}>
            <Text style={styles.reportTitle}>{report.reportTitle}</Text>
            <Text style={styles.reportNumber}>Report No: {report.reportNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Details</Text>
          <View style={styles.detailsGrid}>
            <DetailCell label="Party Name" value={report.partyName} />
            <DetailCell label="Variety" value={report.variety} />
            <DetailCell label="Lot Number" value={report.lotNumber} />
            <DetailCell label="Mill" value={report.millName} />
            <DetailCell label="Mill Owner" value={report.millOwnerName} />
            <DetailCell label="Submission Date" value={report.submissionDate} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Results Table</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <View style={styles.fieldCol}>
                <Text style={styles.headerText}>Parameter</Text>
              </View>
              <View style={styles.typeCol}>
                <Text style={styles.headerText}>Type</Text>
              </View>
              <View style={styles.valueCol}>
                <Text style={styles.headerText}>Result</Text>
              </View>
            </View>
            {report.results.map((result) => (
              <View key={result.name} style={styles.tableRow} wrap={false}>
                <View style={styles.fieldCol}>
                  <Text>{result.name}</Text>
                </View>
                <View style={styles.typeCol}>
                  <Text>{result.type}</Text>
                </View>
                <View style={styles.valueCol}>
                  <Text>{result.value || "-"}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authorization</Text>
          <View style={styles.approvalBox}>
            <View style={[styles.approvalCell, styles.approvalDivider]}>
              <Text style={styles.detailLabel}>Analyst</Text>
              <Text style={styles.detailValue}>{report.analyst}</Text>
              <Text style={styles.signatureLine}>Analyst Signature</Text>
            </View>
            <View style={styles.approvalCell}>
              <Text style={styles.detailLabel}>QA Approval</Text>
              <Text style={styles.detailValue}>{report.qaApproval}</Text>
              <Text style={styles.signatureLine}>Approved {report.approvedAt}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>{report.reportNumber}</Text>
          <Text>Generated from approved lab report</Text>
        </View>
      </Page>
    </Document>
  )
}
