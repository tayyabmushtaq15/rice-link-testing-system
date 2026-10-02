import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

export type DispatchPdfData = {
  dispatchNo: string
  status: string
  dispatchDate: string
  companyName: string
  companyAddress: string
  companyPhone: string
  customerName: string
  customerAddress: string
  invoiceNo: string
  godownName: string
  vehicleNo: string
  driverName: string
  deliveryNotes: string
  lines: { product: string; quantity: string; unit: string }[]
  totalQuantity: string
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
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
    borderBottomColor: "#e1defa",
    paddingBottom: 10,
    marginBottom: 10,
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
    backgroundColor: "#6d28d9",
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
    color: "#5f5f6f",
  },
  titleBlock: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#6d28d9",
  },
  reportNumber: {
    marginTop: 4,
    color: "#5f5f6f",
  },
  statusPill: {
    marginTop: 4,
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#6d28d9",
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#6d28d9",
    marginBottom: 5,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#e1defa",
  },
  detailCell: {
    width: "33.333%",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#e1defa",
    borderBottomWidth: 1,
    borderBottomColor: "#e1defa",
  },
  detailLabel: {
    color: "#5f5f6f",
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
    borderColor: "#d9d5ec",
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 19,
    borderBottomWidth: 1,
    borderBottomColor: "#e1defa",
  },
  tableHeader: {
    backgroundColor: "#f2effb",
  },
  headerText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#3a2e63",
    textTransform: "uppercase",
  },
  lineLabelCol: {
    width: "60%",
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#e1defa",
  },
  lineValueCol: {
    width: "20%",
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: "#e1defa",
  },
  lineLastCol: {
    width: "20%",
    padding: 4,
  },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#d9d5ec",
    backgroundColor: "#f2effb",
    paddingVertical: 4,
  },
  signatureRow: {
    flexDirection: "row",
    marginTop: 34,
    gap: 24,
  },
  signatureBlock: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "#5f5f6f",
    paddingTop: 4,
    textAlign: "center",
    color: "#5f5f6f",
  },
  footer: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 14,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#e1defa",
    color: "#7b7b8f",
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

function LineTable({
  rows,
  totalQuantity,
}: {
  rows: DispatchPdfData["lines"]
  totalQuantity: string
}) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <View style={styles.lineLabelCol}>
          <Text style={styles.headerText}>Product</Text>
        </View>
        <View style={styles.lineValueCol}>
          <Text style={styles.headerText}>Quantity</Text>
        </View>
        <View style={styles.lineLastCol}>
          <Text style={styles.headerText}>Unit</Text>
        </View>
      </View>
      {rows.map((row, index) => (
        <View key={`${row.product}-${index}`} style={styles.tableRow} wrap={false}>
          <View style={styles.lineLabelCol}>
            <Text>{row.product}</Text>
          </View>
          <View style={styles.lineValueCol}>
            <Text>{row.quantity}</Text>
          </View>
          <View style={styles.lineLastCol}>
            <Text>{row.unit}</Text>
          </View>
        </View>
      ))}
      <View style={styles.totalRow}>
        <View style={styles.lineLabelCol}>
          <Text style={{ fontWeight: "bold" }}>Total dispatched quantity</Text>
        </View>
        <View style={styles.lineValueCol}>
          <Text style={{ fontWeight: "bold" }}>{totalQuantity}</Text>
        </View>
        <View style={styles.lineLastCol} />
      </View>
    </View>
  )
}

export function DispatchPdfDocument({ dispatch }: { dispatch: DispatchPdfData }) {
  return (
    <Document title={`${dispatch.dispatchNo} - Delivery Challan`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <Text>{dispatch.companyName.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.companyName}>{dispatch.companyName}</Text>
              {dispatch.companyAddress ? (
                <Text style={styles.companySubline}>{dispatch.companyAddress}</Text>
              ) : null}
              {dispatch.companyPhone ? (
                <Text style={styles.companySubline}>{dispatch.companyPhone}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Delivery Challan</Text>
            <Text style={styles.reportNumber}>Dispatch No: {dispatch.dispatchNo}</Text>
            <Text style={styles.statusPill}>{dispatch.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispatch Details</Text>
          <View style={styles.detailsGrid}>
            <DetailCell label="Customer" value={dispatch.customerName} />
            <DetailCell label="Sale Invoice" value={dispatch.invoiceNo} />
            <DetailCell label="Dispatch Date" value={dispatch.dispatchDate} />
            <DetailCell label="Godown" value={dispatch.godownName} />
            <DetailCell label="Vehicle No." value={dispatch.vehicleNo || "-"} />
            <DetailCell label="Driver" value={dispatch.driverName || "-"} />
            {dispatch.customerAddress ? (
              <DetailCell label="Delivery Address" value={dispatch.customerAddress} />
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Dispatched</Text>
          <LineTable rows={dispatch.lines} totalQuantity={dispatch.totalQuantity} />
        </View>

        {dispatch.deliveryNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Notes</Text>
            <Text>{dispatch.deliveryNotes}</Text>
          </View>
        ) : null}

        <View style={styles.signatureRow}>
          <Text style={styles.signatureBlock}>Dispatched By</Text>
          <Text style={styles.signatureBlock}>Driver / Transporter</Text>
          <Text style={styles.signatureBlock}>Received By (Customer)</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>{dispatch.dispatchNo}</Text>
          <Text>Generated from recorded dispatch data</Text>
        </View>
      </Page>
    </Document>
  )
}
