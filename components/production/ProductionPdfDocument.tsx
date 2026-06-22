import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

export type ProductionPdfData = {
  reportNumber: string
  lotNumber: string
  partyName: string
  variety: string
  millName: string
  purchaseDate: string
  paddyWeight: string
  purchaseRate: string
  paddyCost: string
  outputRows: {
    label: string
    weight: string
    percent: string
  }[]
  costRows: {
    label: string
    amount: string
  }[]
  saleRows: {
    label: string
    weight: string
    rate: string
    value: string
  }[]
  summaryRows: {
    label: string
    value: string
  }[]
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#17211b",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#d7e5dc",
    paddingBottom: 14,
    marginBottom: 14,
  },
  brand: {
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: "#0f7a52",
    color: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "bold",
  },
  companyName: {
    fontSize: 15,
    fontWeight: "bold",
  },
  companySubline: {
    marginTop: 2,
    color: "#5f6f65",
  },
  titleBlock: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f7a52",
  },
  reportNumber: {
    marginTop: 4,
    color: "#5f6f65",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#0f7a52",
    marginBottom: 6,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#d7e5dc",
  },
  detailCell: {
    width: "33.333%",
    padding: 7,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
    borderBottomWidth: 1,
    borderBottomColor: "#d7e5dc",
  },
  detailLabel: {
    color: "#5f6f65",
    fontSize: 7,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd9d0",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 23,
    borderBottomWidth: 1,
    borderBottomColor: "#d7e5dc",
  },
  tableHeader: {
    backgroundColor: "#edf6f1",
  },
  headerText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#234133",
    textTransform: "uppercase",
  },
  outputLabelCol: {
    width: "50%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
  },
  outputValueCol: {
    width: "25%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
  },
  outputLastCol: {
    width: "25%",
    padding: 6,
  },
  costLabelCol: {
    width: "60%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
  },
  costValueCol: {
    width: "40%",
    padding: 6,
  },
  saleLabelCol: {
    width: "34%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
  },
  saleValueCol: {
    width: "22%",
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#d7e5dc",
  },
  saleLastCol: {
    width: "22%",
    padding: 6,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    width: "50%",
  },
  footer: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 22,
    paddingTop: 7,
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
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

function OutputTable({ rows }: { rows: ProductionPdfData["outputRows"] }) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <View style={styles.outputLabelCol}>
          <Text style={styles.headerText}>Output</Text>
        </View>
        <View style={styles.outputValueCol}>
          <Text style={styles.headerText}>Weight</Text>
        </View>
        <View style={styles.outputLastCol}>
          <Text style={styles.headerText}>Recovery</Text>
        </View>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.tableRow} wrap={false}>
          <View style={styles.outputLabelCol}>
            <Text>{row.label}</Text>
          </View>
          <View style={styles.outputValueCol}>
            <Text>{row.weight}</Text>
          </View>
          <View style={styles.outputLastCol}>
            <Text>{row.percent}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function CostTable({ rows }: { rows: ProductionPdfData["costRows"] }) {
  return (
    <View style={styles.table}>
      {rows.map((row) => (
        <View key={row.label} style={styles.tableRow} wrap={false}>
          <View style={styles.costLabelCol}>
            <Text>{row.label}</Text>
          </View>
          <View style={styles.costValueCol}>
            <Text>{row.amount}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function SaleTable({ rows }: { rows: ProductionPdfData["saleRows"] }) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <View style={styles.saleLabelCol}>
          <Text style={styles.headerText}>Item</Text>
        </View>
        <View style={styles.saleValueCol}>
          <Text style={styles.headerText}>Weight</Text>
        </View>
        <View style={styles.saleValueCol}>
          <Text style={styles.headerText}>Rate</Text>
        </View>
        <View style={styles.saleLastCol}>
          <Text style={styles.headerText}>Value</Text>
        </View>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.tableRow} wrap={false}>
          <View style={styles.saleLabelCol}>
            <Text>{row.label}</Text>
          </View>
          <View style={styles.saleValueCol}>
            <Text>{row.weight}</Text>
          </View>
          <View style={styles.saleValueCol}>
            <Text>{row.rate}</Text>
          </View>
          <View style={styles.saleLastCol}>
            <Text>{row.value}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

export function ProductionPdfDocument({ report }: { report: ProductionPdfData }) {
  return (
    <Document title={`${report.reportNumber} - ${report.lotNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text>RML</Text>
            </View>
            <View>
              <Text style={styles.companyName}>Rice Mill Lab</Text>
              <Text style={styles.companySubline}>Production Costing Report</Text>
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Production Report</Text>
            <Text style={styles.reportNumber}>Report No: {report.reportNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lot Details</Text>
          <View style={styles.detailsGrid}>
            <DetailCell label="Party Name" value={report.partyName} />
            <DetailCell label="Lot Number" value={report.lotNumber} />
            <DetailCell label="Variety" value={report.variety} />
            <DetailCell label="Mill" value={report.millName} />
            <DetailCell label="Purchase Date" value={report.purchaseDate} />
            <DetailCell label="Paddy Weight" value={report.paddyWeight} />
            <DetailCell label="Purchase Rate" value={report.purchaseRate} />
            <DetailCell label="Paddy Cost" value={report.paddyCost} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Output and Recovery</Text>
          <OutputTable rows={report.outputRows} />
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.half}>
            <Text style={styles.sectionTitle}>Costing</Text>
            <CostTable rows={report.costRows} />
          </View>
          <View style={styles.half}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <CostTable rows={report.summaryRows.map((row) => ({ label: row.label, amount: row.value }))} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expected Sale Value</Text>
          <SaleTable rows={report.saleRows} />
        </View>

        <View style={styles.footer} fixed>
          <Text>{report.reportNumber}</Text>
          <Text>Generated from recorded production output</Text>
        </View>
      </Page>
    </Document>
  )
}
