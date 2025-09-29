import React, { useState, useMemo } from 'react';
import { Page, Text, View, Document, StyleSheet, Font, pdf, Image } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import Header from "./header";
import MenuLateral from "./menu-lateral";
import logo from "../logo-negro.png"


// Registrar una fuente más elegante
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf' }, // Regular
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 'bold' }, // Bold (usa TTF, no WOFF2)
  ],
});


// 🎨 Estilos renovados
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    lineHeight: 1.6,
    fontFamily: 'Roboto',
    color: '#1e293b', // gris oscuro
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    borderBottom: '2px solid #d88c6d',
    paddingBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
  companyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d88c6d',
    textAlign: 'right',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    color: '#d88c6d',
  },
  subHeader: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 15,
    textAlign: 'center',
  },
  table: {
    display: 'flex',
    width: '100%',
    border: '1px solid #c2c2c2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1px solid #c2c2c2',
  },
  headerRow: {
    backgroundColor: '#d88c6d',
    color: 'white',
    fontWeight: 'bold',
  },
  cell: {
    padding: 8,
    flex: 1,
    borderRight: '1px solid #c2c2c2',
  },
  lastCell: {
    borderRight: 'none',
  },
  bold: {
    fontWeight: 'bold',
  },
  totalRow: {
    backgroundColor: '#d88c6d',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 6,
    color: '#f5ebdd',
  },
});

// 📄 Componente PDF mejorado
const FinancialStatementPDF = ({ type, data, period }) => {
  const renderRows = (rows) =>
    rows.map((row, idx) => {
      const value = typeof row.value === 'number' ? row.value : 0;
      return (
        <View
          key={idx}
          style={[
            styles.row,
            row.isTotal && styles.totalRow,
          ]}
        >
          <Text style={[styles.cell, row.bold && styles.bold]}>
            {row.label}
          </Text>
          <Text style={[styles.cell, styles.lastCell, row.bold && styles.bold]}>
            {value.toFixed(2)}
          </Text>
        </View>
      );
    });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado con logo y nombre empresa */}
        <View style={styles.headerContainer}>
          <Image src={logo} style={styles.logo} />
          <Text style={styles.companyTitle}>Estados Financieros</Text>
        </View>

        {/* Título */}
        <Text style={styles.header}>
          {type === 'cashFlow'
            ? 'Estado de Flujo de Efectivo'
            : type === 'incomeStatement'
            ? 'Estado de Resultados'
            : 'Balance General'}
        </Text>
        <Text style={styles.subHeader}>
          {type === 'balanceSheet'
            ? `Fecha: ${period}`
            : `Periodo: ${period}`}
        </Text>

        {/* Contenido */}
        {type === 'balanceSheet' ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.sectionTitle}>ACTIVOS</Text>
              <View style={styles.table}>{renderRows(data.assets)}</View>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.sectionTitle}>PASIVOS Y PATRIMONIO</Text>
              <View style={styles.table}>{renderRows(data.liabilities)}</View>
            </View>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Encabezado de tabla */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={[styles.cell, styles.bold]}>Concepto</Text>
              <Text style={[styles.cell, styles.lastCell, styles.bold]}>Monto</Text>
            </View>
            {renderRows(data)}
          </View>
        )}
      </Page>
    </Document>
  );
};



// Componente principal
const FinancialStatementsGenerator = () => {

    const [menuAbierto, setmenuAbierto] = useState(false);


    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [activeTab, setActiveTab] = useState('cashFlow');

    // Estados editables
    const [cashFlowData, setCashFlowData] = useState({
        ingresosVentas: 0,
        pagosProveedores: 0,
        salarios: 0,
        gastosTransporte: 0,
        paqueteriaEnvios: 0,
        otrosGastosOp: 0,
        compraActivos: 0,
        ventaActivos: 0,
        prestamosObtenidos: 0,
        pagosPrestamos: 0,
        dividendos: 0
    });

    const [incomeData, setIncomeData] = useState({
        ventasNetas: 0,
        ingresosServicios: 0,
        ingresosInversiones: 0,
        otrosIngresos: 0,
        costoVentas: 0,
        gastosAdmin: 0,
        gastosVentas: 0,
        gastosFinancieros: 0,
        depreciacion: 0,
        gastosTransporte: 0,
        paqueteriaEnvios: 0,
        ingresosNoOp: 0,
        gastosNoOp: 0,
        impuestos: 0
    });

    const [balanceData, setBalanceData] = useState({
        efectivo: 10000,
        cuentasCobrar: 0,
        inventarios: 0,
        otrosActivosCorr: 0,
        ppe: 0,
        depreciacionAcum: 0,
        activosIntangibles: 0,
        otrosActivosNoCorr: 0,
        cuentasPagar: 0,
        prestamosCorto: 0,
        obligacionesFiscales: 0,
        otrosPasivosCorr: 0,
        prestamosLargo: 0,
        otrosPasivosNoCorr: 0,
        capitalSocial: 0,
        utilidadesRetenidas: 0,
        otrosPatrimonio: 0
    });

    const [efectivoInicial, setEfectivoInicial] = useState(0);

    const manejadorMenu = () => {
        setmenuAbierto(!menuAbierto);
    };

    // Cálculos memoizados
    const cashFlowRows = useMemo(() => {
        const op = (cashFlowData.ingresosVentas || 0) -
            (cashFlowData.pagosProveedores || 0) -
            (cashFlowData.salarios || 0) -
            (cashFlowData.gastosTransporte || 0) -
            (cashFlowData.paqueteriaEnvios || 0) -
            (cashFlowData.otrosGastosOp || 0);
        const inv = -cashFlowData.compraActivos + cashFlowData.ventaActivos;
        const fin = cashFlowData.prestamosObtenidos - cashFlowData.pagosPrestamos - cashFlowData.dividendos;
        const neto = op + inv + fin;
        const final = neto + efectivoInicial;

        return [
            { label: 'Actividades Operativas', bold: true },
            { label: 'Ingresos por ventas', value: cashFlowData.ingresosVentas },
            { label: 'Pagos a proveedores', value: -cashFlowData.pagosProveedores },
            { label: 'Salarios y beneficios', value: -cashFlowData.salarios },
            { label: 'Gastos de transporte', value: -cashFlowData.gastosTransporte },
            { label: 'Paquetería o envíos', value: -cashFlowData.paqueteriaEnvios },
            { label: 'Otros gastos operativos', value: -cashFlowData.otrosGastosOp },
            { label: 'Flujo de efectivo operativo', value: op, isTotal: true },
            { label: 'Actividades de Inversión', bold: true },
            { label: 'Compra de activos fijos', value: -cashFlowData.compraActivos },
            { label: 'Venta de activos fijos', value: cashFlowData.ventaActivos },
            { label: 'Flujo de efectivo de inversión', value: inv, isTotal: true },
            { label: 'Actividades de Financiamiento', bold: true },
            { label: 'Préstamos obtenidos', value: cashFlowData.prestamosObtenidos },
            { label: 'Pagos de préstamos', value: -cashFlowData.pagosPrestamos },
            { label: 'Dividendos pagados', value: -cashFlowData.dividendos },
            { label: 'Flujo de efectivo de financiamiento', value: fin, isTotal: true },
            { label: 'Aumento (Disminución) Neto de Efectivo', value: neto, isTotal: true, bold: true },
            { label: 'Efectivo al Inicio del Periodo', value: efectivoInicial, isTotal: true },
            { label: 'Efectivo al Final del Periodo', value: final, isTotal: true, bold: true }
        ];
    }, [cashFlowData]);

    const incomeRows = useMemo(() => {
        const ingresosTotales = (incomeData.ventasNetas || 0) + (incomeData.ingresosServicios || 0) +
            (incomeData.ingresosInversiones || 0) + (incomeData.otrosIngresos || 0);
        const gastosTotales = (incomeData.costoVentas || 0) + (incomeData.gastosAdmin || 0) +
            (incomeData.gastosVentas || 0) + (incomeData.gastosFinancieros || 0) +
            (incomeData.depreciacion || 0) + (incomeData.gastosTransporte || 0) +
            (incomeData.paqueteriaEnvios || 0);
        const utilidadOp = ingresosTotales - gastosTotales;
        const utilidadAntesImp = utilidadOp + (incomeData.ingresosNoOp || 0) - (incomeData.gastosNoOp || 0);
        const utilidadNeta = utilidadAntesImp - (incomeData.impuestos || 0);

        return [
            { label: 'Ingresos', bold: true },
            { label: 'Ventas netas', value: incomeData.ventasNetas },
            { label: 'Ingresos por servicios', value: incomeData.ingresosServicios },
            { label: 'Ingresos por inversiones', value: incomeData.ingresosInversiones },
            { label: 'Otros ingresos operativos', value: incomeData.otrosIngresos },
            { label: 'Ingresos Totales', value: ingresosTotales, isTotal: true },
            { label: 'Costos y Gastos', bold: true },
            { label: 'Costo de ventas', value: incomeData.costoVentas },
            { label: 'Gastos de administración', value: incomeData.gastosAdmin },
            { label: 'Gastos de ventas', value: incomeData.gastosVentas },
            { label: 'Gastos financieros', value: incomeData.gastosFinancieros },
            { label: 'Depreciación y amortización', value: incomeData.depreciacion },
            { label: 'Gastos de transporte', value: incomeData.gastosTransporte },
            { label: 'Paquetería o envíos', value: incomeData.paqueteriaEnvios },
            { label: 'Costos y Gastos Totales', value: gastosTotales, isTotal: true },
            { label: 'Utilidad Operativa', value: utilidadOp, isTotal: true, bold: true },
            { label: 'Ingresos no operativos', value: incomeData.ingresosNoOp },
            { label: 'Gastos no operativos', value: -incomeData.gastosNoOp },
            { label: 'Utilidad Antes de Impuestos', value: utilidadAntesImp, isTotal: true, bold: true },
            { label: 'Impuestos sobre la renta', value: -incomeData.impuestos },
            { label: 'Utilidad Neta', value: utilidadNeta, isTotal: true, bold: true }
        ];
    }, [incomeData]);

    const balanceRows = useMemo(() => {
        const activosCorr = (balanceData.efectivo || 0) + (balanceData.cuentasCobrar || 0) +
            (balanceData.inventarios || 0) + (balanceData.otrosActivosCorr || 0);
        const activosNoCorr = (balanceData.ppe || 0) - (balanceData.depreciacionAcum || 0) +
            (balanceData.activosIntangibles || 0) + (balanceData.otrosActivosNoCorr || 0);
        const activosTotales = activosCorr + activosNoCorr;

        const pasivosCorr = (balanceData.cuentasPagar || 0) + (balanceData.prestamosCorto || 0) +
            (balanceData.obligacionesFiscales || 0) + (balanceData.otrosPasivosCorr || 0);
        const pasivosNoCorr = (balanceData.prestamosLargo || 0) + (balanceData.otrosPasivosNoCorr || 0);
        const pasivosTotales = pasivosCorr + pasivosNoCorr;

        const patrimonio = (balanceData.capitalSocial || 0) + (balanceData.utilidadesRetenidas || 0) +
            (balanceData.otrosPatrimonio || 0);
        const totalPasivosPatrimonio = pasivosTotales + patrimonio;

        return {
            assets: [
                { label: 'Activos Corrientes', bold: true },
                { label: 'Efectivo y equivalentes', value: balanceData.efectivo },
                { label: 'Cuentas por cobrar', value: balanceData.cuentasCobrar },
                { label: 'Inventarios', value: balanceData.inventarios },
                { label: 'Otros activos corrientes', value: balanceData.otrosActivosCorr },
                { label: 'Activos Corrientes Totales', value: activosCorr, isTotal: true },
                { label: 'Activos No Corrientes', bold: true },
                { label: 'Propiedad, planta y equipo', value: balanceData.ppe },
                { label: 'Menos: Depreciación acumulada', value: -balanceData.depreciacionAcum },
                { label: 'Activos intangibles', value: balanceData.activosIntangibles },
                { label: 'Otros activos no corrientes', value: balanceData.otrosActivosNoCorr },
                { label: 'Activos No Corrientes Totales', value: activosNoCorr, isTotal: true },
                { label: 'ACTIVOS TOTALES', value: activosTotales, isTotal: true, bold: true }
            ],
            liabilities: [
                { label: 'Pasivos Corrientes', bold: true },
                { label: 'Cuentas por pagar', value: balanceData.cuentasPagar },
                { label: 'Préstamos a corto plazo', value: balanceData.prestamosCorto },
                { label: 'Obligaciones fiscales', value: balanceData.obligacionesFiscales },
                { label: 'Otros pasivos corrientes', value: balanceData.otrosPasivosCorr },
                { label: 'Pasivos Corrientes Totales', value: pasivosCorr, isTotal: true },
                { label: 'Pasivos No Corrientes', bold: true },
                { label: 'Préstamos a largo plazo', value: balanceData.prestamosLargo },
                { label: 'Otros pasivos no corrientes', value: balanceData.otrosPasivosNoCorr },
                { label: 'Pasivos No Corrientes Totales', value: pasivosNoCorr, isTotal: true },
                { label: 'PASIVOS TOTALES', value: pasivosTotales, isTotal: true, bold: true },
                { label: 'Patrimonio', bold: true },
                { label: 'Capital social', value: balanceData.capitalSocial },
                { label: 'Utilidades retenidas', value: balanceData.utilidadesRetenidas },
                { label: 'Otros componentes del patrimonio', value: balanceData.otrosPatrimonio },
                { label: 'Patrimonio Total', value: patrimonio, isTotal: true },
                { label: 'PASIVOS Y PATRIMONIO TOTALES', value: totalPasivosPatrimonio, isTotal: true, bold: true }
            ]
        };
    }, [balanceData]);

    const periodLabel = useMemo(() => {
        const start = new Date(startDate).toLocaleDateString('es-ES');
        const end = new Date(endDate).toLocaleDateString('es-ES');
        return `${start} - ${end}`;
    }, [startDate, endDate]);

    const handleExportPDF = async (type) => {
        let data, fileName;
        if (type === 'cashFlow') {
            data = cashFlowRows;
            fileName = 'flujo-efectivo.pdf';
        } else if (type === 'incomeStatement') {
            data = incomeRows;
            fileName = 'estado-resultados.pdf';
        } else {
            data = balanceRows;
            fileName = 'balance-general.pdf';
        }

        const doc = <FinancialStatementPDF type={type} data={data} period={type === 'balanceSheet' ? new Date(endDate).toLocaleDateString('es-ES') : periodLabel} />;
        const asPdf = pdf(doc);
        const blob = await asPdf.toBlob();
        saveAs(blob, fileName);
    };

    const EditableCell = ({ value, onChange }) => {
        const [temp, setTemp] = useState(value.toString());

        const handleBlur = () => {
            const num = parseFloat(temp);
            onChange(isNaN(num) ? 0 : num);
        };

        return (
            <input
                type="text"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                onBlur={handleBlur}
                className="w-full text-right px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
        );
    };


    return (
        <div className="bg-pink-100 min-h-screen">
            <header className="relative">
                <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
                <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Generador de Estados Financieros</h1>
            </header>
            <div>
                <MenuLateral menuAbierto={menuAbierto} />
            </div>
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <p className="text-gray-600">Cree y exporte estados financieros profesionales para su negocio</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Periodo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        {['cashFlow', 'incomeStatement', 'balanceSheet'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === tab
                                    ? 'bg-pink-400 text-white'
                                    : 'text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                {tab === 'cashFlow' && 'Flujo de Efectivo'}
                                {tab === 'incomeStatement' && 'Estado de Resultados'}
                                {tab === 'balanceSheet' && 'Balance General'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cash Flow */}
                {activeTab === 'cashFlow' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="bg-gradient-to-r from-pink-400 to-biege text-white p-4 rounded-md mb-6">
                            <h2 className="text-xl font-semibold">Estado de Flujo de Efectivo</h2>
                            <p className="text-sm opacity-90 mt-1">Periodo: {periodLabel}</p>
                        </div>
                        <table className="w-full border-collapse mb-6">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Concepto</th>
                                    <th className="border p-2 text-right">Monto ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td className="font-bold border p-2">Actividades Operativas</td><td className="border p-2"></td></tr>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Efectivo Inicial</label>
                                    <EditableCell value={efectivoInicial} onChange={setEfectivoInicial} />
                                </div>
                                <tr><td className="border p-2 pl-6">Ingresos por ventas</td><td className="border p-2"><EditableCell value={cashFlowData.ingresosVentas} onChange={(v) => setCashFlowData({ ...cashFlowData, ingresosVentas: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Pagos a proveedores</td><td className="border p-2"><EditableCell value={cashFlowData.pagosProveedores} onChange={(v) => setCashFlowData({ ...cashFlowData, pagosProveedores: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Salarios y beneficios</td><td className="border p-2"><EditableCell value={cashFlowData.salarios} onChange={(v) => setCashFlowData({ ...cashFlowData, salarios: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Gastos de transporte</td><td className="border p-2"><EditableCell value={cashFlowData.gastosTransporte} onChange={(v) => setCashFlowData({ ...cashFlowData, gastosTransporte: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Paquetería o envíos</td><td className="border p-2"><EditableCell value={cashFlowData.paqueteriaEnvios} onChange={(v) => setCashFlowData({ ...cashFlowData, paqueteriaEnvios: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Otros gastos operativos</td><td className="border p-2"><EditableCell value={cashFlowData.otrosGastosOp} onChange={(v) => setCashFlowData({ ...cashFlowData, otrosGastosOp: v })} /></td></tr>
                                <tr className="bg-gray-100 font-bold"><td className="border p-2">Flujo de efectivo operativo</td><td className="border p-2 text-right">{cashFlowRows.find(r => r.label === 'Flujo de efectivo operativo')?.value.toFixed(2)}</td></tr>
                                <tr><td className="font-bold border p-2">Actividades de Inversión</td><td className="border p-2"></td></tr>
                                <tr><td className="border p-2 pl-6">Compra de activos fijos</td><td className="border p-2"><EditableCell value={cashFlowData.compraActivos} onChange={(v) => setCashFlowData({ ...cashFlowData, compraActivos: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Venta de activos fijos</td><td className="border p-2"><EditableCell value={cashFlowData.ventaActivos} onChange={(v) => setCashFlowData({ ...cashFlowData, ventaActivos: v })} /></td></tr>
                                <tr className="bg-gray-100 font-bold"><td className="border p-2">Flujo de efectivo de inversión</td><td className="border p-2 text-right">{cashFlowRows.find(r => r.label === 'Flujo de efectivo de inversión')?.value.toFixed(2)}</td></tr>
                                <tr><td className="font-bold border p-2">Actividades de Financiamiento</td><td className="border p-2"></td></tr>
                                <tr><td className="border p-2 pl-6">Préstamos obtenidos</td><td className="border p-2"><EditableCell value={cashFlowData.prestamosObtenidos} onChange={(v) => setCashFlowData({ ...cashFlowData, prestamosObtenidos: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Pagos de préstamos</td><td className="border p-2"><EditableCell value={cashFlowData.pagosPrestamos} onChange={(v) => setCashFlowData({ ...cashFlowData, pagosPrestamos: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Dividendos pagados</td><td className="border p-2"><EditableCell value={cashFlowData.dividendos} onChange={(v) => setCashFlowData({ ...cashFlowData, dividendos: v })} /></td></tr>
                                <tr className="bg-gray-100 font-bold"><td className="border p-2">Flujo de efectivo de financiamiento</td><td className="border p-2 text-right">{cashFlowRows.find(r => r.label === 'Flujo de efectivo de financiamiento')?.value.toFixed(2)}</td></tr>
                                <tr className="bg-gray-200 font-bold"><td className="border p-2">Aumento (Disminución) Neto de Efectivo</td><td className="border p-2 text-right">{cashFlowRows.find(r => r.label === 'Aumento (Disminución) Neto de Efectivo')?.value.toFixed(2)}</td></tr>
                                <tr className="bg-gray-200 font-bold"><td className="border p-2">Efectivo al Final del Periodo</td><td className="border p-2 text-right">{cashFlowRows.find(r => r.label === 'Efectivo al Final del Periodo')?.value.toFixed(2)}</td></tr>
                            </tbody>
                        </table>
                        <div className="flex justify-end">
                            <button
                                onClick={() => handleExportPDF('cashFlow')}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                            >
                                Exportar a PDF
                            </button>
                        </div>
                    </div>
                )}

                {/* Income Statement */}
                {activeTab === 'incomeStatement' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="bg-gradient-to-r from-pink-400 to-biege text-white p-4 rounded-md mb-6">
                            <h2 className="text-xl font-semibold">Estado de Resultados (Contabilidad Devengada)</h2>
                            <p className="text-sm opacity-90 mt-1">Periodo: {periodLabel}</p>
                        </div>
                        <table className="w-full border-collapse mb-6">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border p-2 text-left">Concepto</th>
                                    <th className="border p-2 text-right">Monto ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td className="font-bold border p-2">Ingresos</td><td className="border p-2"></td></tr>
                                <tr><td className="border p-2 pl-6">Ventas netas</td><td className="border p-2"><EditableCell value={incomeData.ventasNetas} onChange={(v) => setIncomeData({ ...incomeData, ventasNetas: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Ingresos por servicios</td><td className="border p-2"><EditableCell value={incomeData.ingresosServicios} onChange={(v) => setIncomeData({ ...incomeData, ingresosServicios: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Ingresos por inversiones</td><td className="border p-2"><EditableCell value={incomeData.ingresosInversiones} onChange={(v) => setIncomeData({ ...incomeData, ingresosInversiones: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Otros ingresos operativos</td><td className="border p-2"><EditableCell value={incomeData.otrosIngresos} onChange={(v) => setIncomeData({ ...incomeData, otrosIngresos: v })} /></td></tr>
                                <tr className="bg-gray-100 font-bold"><td className="border p-2">Ingresos Totales</td><td className="border p-2 text-right">{incomeRows.find(r => r.label === 'Ingresos Totales')?.value.toFixed(2)}</td></tr>
                                <tr><td className="font-bold border p-2">Costos y Gastos</td><td className="border p-2"></td></tr>
                                <tr><td className="border p-2 pl-6">Costo de ventas</td><td className="border p-2"><EditableCell value={incomeData.costoVentas} onChange={(v) => setIncomeData({ ...incomeData, costoVentas: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Gastos de administración</td><td className="border p-2"><EditableCell value={incomeData.gastosAdmin} onChange={(v) => setIncomeData({ ...incomeData, gastosAdmin: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Gastos de ventas</td><td className="border p-2"><EditableCell value={incomeData.gastosVentas} onChange={(v) => setIncomeData({ ...incomeData, gastosVentas: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Gastos financieros</td><td className="border p-2"><EditableCell value={incomeData.gastosFinancieros} onChange={(v) => setIncomeData({ ...incomeData, gastosFinancieros: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Depreciación y amortización</td><td className="border p-2"><EditableCell value={incomeData.depreciacion} onChange={(v) => setIncomeData({ ...incomeData, depreciacion: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Gastos de transporte</td><td className="border p-2"><EditableCell value={incomeData.gastosTransporte} onChange={(v) => setIncomeData({ ...incomeData, gastosTransporte: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Paquetería o envíos</td><td className="border p-2"><EditableCell value={incomeData.paqueteriaEnvios} onChange={(v) => setIncomeData({ ...incomeData, paqueteriaEnvios: v })} /></td></tr>
                                <tr className="bg-gray-100 font-bold"><td className="border p-2">Costos y Gastos Totales</td><td className="border p-2 text-right">{incomeRows.find(r => r.label === 'Costos y Gastos Totales')?.value.toFixed(2)}</td></tr>
                                <tr className="bg-gray-200 font-bold"><td className="border p-2">Utilidad Operativa</td><td className="border p-2 text-right">{incomeRows.find(r => r.label === 'Utilidad Operativa')?.value.toFixed(2)}</td></tr>
                                <tr><td className="border p-2 pl-6">Ingresos no operativos</td><td className="border p-2"><EditableCell value={incomeData.ingresosNoOp} onChange={(v) => setIncomeData({ ...incomeData, ingresosNoOp: v })} /></td></tr>
                                <tr><td className="border p-2 pl-6">Gastos no operativos</td><td className="border p-2"><EditableCell value={incomeData.gastosNoOp} onChange={(v) => setIncomeData({ ...incomeData, gastosNoOp: v })} /></td></tr>
                                <tr className="bg-gray-200 font-bold"><td className="border p-2">Utilidad Antes de Impuestos</td><td className="border p-2 text-right">{incomeRows.find(r => r.label === 'Utilidad Antes de Impuestos')?.value.toFixed(2)}</td></tr>
                                <tr><td className="border p-2 pl-6">Impuestos sobre la renta</td><td className="border p-2"><EditableCell value={incomeData.impuestos} onChange={(v) => setIncomeData({ ...incomeData, impuestos: v })} /></td></tr>
                                <tr className="bg-gray-200 font-bold"><td className="border p-2">Utilidad Neta</td><td className="border p-2 text-right">{incomeRows.find(r => r.label === 'Utilidad Neta')?.value.toFixed(2)}</td></tr>
                            </tbody>
                        </table>
                        <div className="flex justify-end">
                            <button
                                onClick={() => handleExportPDF('incomeStatement')}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                            >
                                Exportar a PDF
                            </button>
                        </div>
                    </div>
                )}

                {/* Balance Sheet */}
                {activeTab === 'balanceSheet' && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="bg-gradient-to-r from-pink-400 to-biege text-white p-4 rounded-md mb-6">
                            <h2 className="text-xl font-semibold">Balance General</h2>
                            <p className="text-sm opacity-90 mt-1">Fecha: {new Date(endDate).toLocaleDateString('es-ES')}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Activos */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">ACTIVOS</h3>
                                <table className="w-full border-collapse mb-6">
                                    <tbody>
                                        <tr><td className="font-bold border p-2">Activos Corrientes</td><td className="border p-2"></td></tr>
                                        <tr><td className="border p-2 pl-6">Efectivo y equivalentes</td><td className="border p-2"><EditableCell value={balanceData.efectivo} onChange={(v) => setBalanceData({ ...balanceData, efectivo: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Cuentas por cobrar</td><td className="border p-2"><EditableCell value={balanceData.cuentasCobrar} onChange={(v) => setBalanceData({ ...balanceData, cuentasCobrar: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Inventarios</td><td className="border p-2"><EditableCell value={balanceData.inventarios} onChange={(v) => setBalanceData({ ...balanceData, inventarios: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Otros activos corrientes</td><td className="border p-2"><EditableCell value={balanceData.otrosActivosCorr} onChange={(v) => setBalanceData({ ...balanceData, otrosActivosCorr: v })} /></td></tr>
                                        <tr className="bg-gray-100 font-bold"><td className="border p-2">Activos Corrientes Totales</td><td className="border p-2 text-right">{balanceRows.assets.find(r => r.label === 'Activos Corrientes Totales')?.value.toFixed(2)}</td></tr>
                                        <tr><td className="font-bold border p-2">Activos No Corrientes</td><td className="border p-2"></td></tr>
                                        <tr><td className="border p-2 pl-6">Propiedad, planta y equipo</td><td className="border p-2"><EditableCell value={balanceData.ppe} onChange={(v) => setBalanceData({ ...balanceData, ppe: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Menos: Depreciación acumulada</td><td className="border p-2"><EditableCell value={balanceData.depreciacionAcum} onChange={(v) => setBalanceData({ ...balanceData, depreciacionAcum: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Activos intangibles</td><td className="border p-2"><EditableCell value={balanceData.activosIntangibles} onChange={(v) => setBalanceData({ ...balanceData, activosIntangibles: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Otros activos no corrientes</td><td className="border p-2"><EditableCell value={balanceData.otrosActivosNoCorr} onChange={(v) => setBalanceData({ ...balanceData, otrosActivosNoCorr: v })} /></td></tr>
                                        <tr className="bg-gray-100 font-bold"><td className="border p-2">Activos No Corrientes Totales</td><td className="border p-2 text-right">{balanceRows.assets.find(r => r.label === 'Activos No Corrientes Totales')?.value.toFixed(2)}</td></tr>
                                        <tr className="bg-gray-200 font-bold"><td className="border p-2">ACTIVOS TOTALES</td><td className="border p-2 text-right">{balanceRows.assets.find(r => r.label === 'ACTIVOS TOTALES')?.value.toFixed(2)}</td></tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Pasivos y Patrimonio */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">PASIVOS Y PATRIMONIO</h3>
                                <table className="w-full border-collapse mb-6">
                                    <tbody>
                                        <tr><td className="font-bold border p-2">Pasivos Corrientes</td><td className="border p-2"></td></tr>
                                        <tr><td className="border p-2 pl-6">Cuentas por pagar</td><td className="border p-2"><EditableCell value={balanceData.cuentasPagar} onChange={(v) => setBalanceData({ ...balanceData, cuentasPagar: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Préstamos a corto plazo</td><td className="border p-2"><EditableCell value={balanceData.prestamosCorto} onChange={(v) => setBalanceData({ ...balanceData, prestamosCorto: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Obligaciones fiscales</td><td className="border p-2"><EditableCell value={balanceData.obligacionesFiscales} onChange={(v) => setBalanceData({ ...balanceData, obligacionesFiscales: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Otros pasivos corrientes</td><td className="border p-2"><EditableCell value={balanceData.otrosPasivosCorr} onChange={(v) => setBalanceData({ ...balanceData, otrosPasivosCorr: v })} /></td></tr>
                                        <tr className="bg-gray-100 font-bold"><td className="border p-2">Pasivos Corrientes Totales</td><td className="border p-2 text-right">{balanceRows.liabilities.find(r => r.label === 'Pasivos Corrientes Totales')?.value.toFixed(2)}</td></tr>
                                        <tr><td className="font-bold border p-2">Pasivos No Corrientes</td><td className="border p-2"></td></tr>
                                        <tr><td className="border p-2 pl-6">Préstamos a largo plazo</td><td className="border p-2"><EditableCell value={balanceData.prestamosLargo} onChange={(v) => setBalanceData({ ...balanceData, prestamosLargo: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Otros pasivos no corrientes</td><td className="border p-2"><EditableCell value={balanceData.otrosPasivosNoCorr} onChange={(v) => setBalanceData({ ...balanceData, otrosPasivosNoCorr: v })} /></td></tr>
                                        <tr className="bg-gray-100 font-bold"><td className="border p-2">Pasivos No Corrientes Totales</td><td className="border p-2 text-right">{balanceRows.liabilities.find(r => r.label === 'Pasivos No Corrientes Totales')?.value.toFixed(2)}</td></tr>
                                        <tr className="bg-gray-200 font-bold"><td className="border p-2">PASIVOS TOTALES</td><td className="border p-2 text-right">{balanceRows.liabilities.find(r => r.label === 'PASIVOS TOTALES')?.value.toFixed(2)}</td></tr>
                                        <tr><td className="font-bold border p-2">Patrimonio</td><td className="border p-2"></td></tr>
                                        <tr><td className="border p-2 pl-6">Capital social</td><td className="border p-2"><EditableCell value={balanceData.capitalSocial} onChange={(v) => setBalanceData({ ...balanceData, capitalSocial: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Utilidades retenidas</td><td className="border p-2"><EditableCell value={balanceData.utilidadesRetenidas} onChange={(v) => setBalanceData({ ...balanceData, utilidadesRetenidas: v })} /></td></tr>
                                        <tr><td className="border p-2 pl-6">Otros componentes del patrimonio</td><td className="border p-2"><EditableCell value={balanceData.otrosPatrimonio} onChange={(v) => setBalanceData({ ...balanceData, otrosPatrimonio: v })} /></td></tr>
                                        <tr className="bg-gray-100 font-bold"><td className="border p-2">Patrimonio Total</td><td className="border p-2 text-right">{balanceRows.liabilities.find(r => r.label === 'Patrimonio Total')?.value.toFixed(2)}</td></tr>
                                        <tr className="bg-gray-200 font-bold"><td className="border p-2">PASIVOS Y PATRIMONIO TOTALES</td><td className="border p-2 text-right">{balanceRows.liabilities.find(r => r.label === 'PASIVOS Y PATRIMONIO TOTALES')?.value.toFixed(2)}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => handleExportPDF('balanceSheet')}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
                            >
                                Exportar a PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialStatementsGenerator;