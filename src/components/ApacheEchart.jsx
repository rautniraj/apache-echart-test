import React, { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";

const yAxisLabelWidth = 250;
const yAxisMaxLineLength = 35;
const chartGrid = {
  left: 250,
  right: 50,
  top: 104,
  bottom: 20,
  containLabel: false,
};
const chartFontFamily = "Arial, sans-serif";
const chartTitleMaxLineLength = 75;
const rowHeight = 75;
const minHeight = 500;

export default function ApacheEchart({
  isLoading = false,
  className,
  ministryUsage,
}) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [drilldownChartHeight, setDrilldownChartHeight] = useState(null);
  const ministries = useMemo(
    () => (Array.isArray(ministryUsage) ? ministryUsage : []),
    [ministryUsage]
  );
  const rootChartHeight = Math.max(minHeight, ministries.length * rowHeight);
  const chartHeight =
    drilldownChartHeight?.source === ministries
      ? drilldownChartHeight.height
      : rootChartHeight;

  useEffect(() => {
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const chart = chartInstanceRef.current;

    const formatTextLinesByWords = (value, maxLineLength) => {
      const words = String(value ?? "").split(" ");
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        if ((currentLine + " " + word).trim().length <= maxLineLength) {
          currentLine = (currentLine + " " + word).trim();
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    };
    const formatTextByWords = (value, maxLineLength) =>
      formatTextLinesByWords(value, maxLineLength).join("\n");
    const formatTitleText = (value) =>
      formatTextLinesByWords(value, chartTitleMaxLineLength)
        .map((line) => `${line}`)
        .join("\n");
    const formatAxisLabel = (value) => formatTextByWords(value, yAxisMaxLineLength);
    const formatCompactNumber = (value) => {
      const numericValue = Number(value || 0);
      const trimTrailingZeros = (formattedValue) =>
        formattedValue.replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");

      if (numericValue >= 1_000_000_000_000) {
        return `${trimTrailingZeros((numericValue / 1_000_000_000_000).toFixed(2))}T`;
      }

      if (numericValue >= 1_000_000_000) {
        return `${trimTrailingZeros((numericValue / 1_000_000_000).toFixed(2))}B`;
      }

      if (numericValue >= 1_000_000) {
        return `${trimTrailingZeros((numericValue / 1_000_000).toFixed(2))}M`;
      }

      if (numericValue >= 1_000) {
        return `${Math.round(numericValue / 1_000)}K`;
      }

      return Math.round(numericValue).toString();
    };
    const getTooltipFormatter = (params) => {
      const item = params.data;

      if (!item) return "";

      return `
                <div style="min-width: 220px; font-family: ${chartFontFamily};">
                    <div style="margin-bottom: 10px; font-size: 14px; font-weight: 700; color: #111827;">
                        ${item.label || params.name}
                    </div>
                    <div style="display: grid; grid-template-columns: auto auto; gap: 6px 18px; font-size: 13px; color: #374151;">
                        <span>Meetings</span>
                        <span style="text-align: right; font-weight: 600; color: #111827;">
                            ${formatCompactNumber(item.meetings_count)}
                        </span>
                        <span>Duration</span>
                        <span style="text-align: right; font-weight: 600; color: #111827;">
                            ${formatCompactNumber(item.duration_sum / 60)} hrs
                        </span>
                        <span>Participants</span>
                        <span style="text-align: right; font-weight: 600; color: #111827;">
                            ${formatCompactNumber(item.participants_sum)}
                        </span>
                    </div>
                </div>
            `;
    };

    const getHeaderGraphic = (titleText, showBack = false) => {
      const headerGraphic = [
        {
          type: "text",
          left: 0,
          top: 10,
          z: 100,
          style: {
            text: formatTitleText(titleText),
            textAlign: "left",
            textVerticalAlign: "top",
            fontSize: 18,
            fontWeight: 600,
            fontFamily: chartFontFamily,
            fill: "#111827",
            lineHeight: 54,
          },
        },
      ];

      if (showBack) {
        headerGraphic.push({
          type: "text",
          left: 20,
          top: 60,
          z: 100,
          style: {
            text: "< Back to Ministries",
            fontSize: 16,
            fontWeight: "bold",
            cursor: "pointer",
            fontFamily: chartFontFamily,
            fill: "#111827",
          },
          onclick: handleBack,
        });
      }

      return headerGraphic;
    };

    const getNoDataGraphic = () => ({
      type: "text",
      left: "center",
      top: "middle",
      z: 100,
      style: {
        text: "No data available",
        textAlign: "center",
        fontSize: 16,
        fontWeight: 600,
        fontFamily: chartFontFamily,
        fill: "#6B7280",
      },
    });

    const getChartOption = (yAxisData, seriesData, extraOption = {}) => ({
      tooltip: {
        trigger: "item",
        backgroundColor: "#FFFFFF",
        borderColor: "#D1D5DB",
        borderWidth: 1,
        padding: 12,
        textStyle: {
          fontFamily: chartFontFamily,
        },
        extraCssText: "box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12); border-radius: 10px;",
        formatter: getTooltipFormatter,
      },
      grid: chartGrid,
      xAxis: {
        type: "value",
        axisLabel: {
          fontFamily: chartFontFamily,
          formatter: formatCompactNumber,
        },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: yAxisData,
        axisTick: {
          show: false,
        },
        axisLabel: {
          width: yAxisLabelWidth,
          overflow: "break",
          lineHeight: 20,
          margin: 20,
          fontFamily: chartFontFamily,
          formatter: formatAxisLabel,
        },
      },
      animationDurationUpdate: 800,
      series: {
        id: "meetings",
        type: "bar",
        colorBy: "data",
        barMaxWidth: 28,
        barCategoryGap: "30%",
        label: {
          show: true,
          position: "right",
          fontFamily: chartFontFamily,
          formatter: ({ value }) => formatCompactNumber(value),
        },
        ...seriesData,
        universalTransition: {
          enabled: true,
          divideShape: "clone",
        },
      },
      ...extraOption,
    });

    if (isLoading) {
      chart.showLoading();
      return;
    }

    chart.hideLoading();

    if (ministries.length === 0) {
      chart.off("click");
      chart.setOption(
        getChartOption(
          [],
          {
            data: [],
          },
          {
            graphic: [
              ...getHeaderGraphic("Meetings by Ministry"),
              getNoDataGraphic(),
            ],
            grid: {
              show: false,
            },
            xAxis: {
              show: false,
            },
            yAxis: {
              show: false,
            },
          }
        ),
        {
          notMerge: true,
        }
      );
      return;
    }

    const rootOption = getChartOption(
      ministries.map((ministry) => ministry.ministry_name),
      {
        data: ministries.map((ministry) => ({
          value: ministry.meetings_count,
          groupId: String(ministry.ministry_id ?? ministry.ministry_name),
          label: ministry.ministry_name,
          meetings_count: ministry.meetings_count,
          duration_sum: ministry.duration_sum,
          participants_sum: ministry.participants_sum,
        })),
      },
      {
        graphic: getHeaderGraphic("Meetings by Ministry"),
      }
    );

    const drilldownData = ministries.map((ministry) => ({
      dataGroupId: String(ministry.ministry_id ?? ministry.ministry_name),
      ministryName: ministry.ministry_name,
      data: ministry.organizations.map((organization) => ({
        value: organization.meetings_count,
        label: organization.organization_name,
        meetings_count: organization.meetings_count,
        duration_sum: organization.duration_sum,
        participants_sum: organization.participants_sum,
      })),
    }));

    const handleBack = () => {
      const newHeight = rootChartHeight;

      setDrilldownChartHeight(null);

      setTimeout(() => {
        chart.resize({
          height: newHeight,
        });

        chart.setOption(rootOption, {
          notMerge: true,
        });
      }, 0);
    };

    const handleChartClick = (event) => {
      if (!event.data) return;

      const drilldown = drilldownData.find(
        (item) => item.dataGroupId === event.data.groupId
      );

      if (!drilldown) return;

      const newHeight = Math.max(minHeight, drilldown.data.length * rowHeight);

      setDrilldownChartHeight({
        source: ministries,
        height: newHeight,
      });

      const drilldownOption = getChartOption(
        drilldown.data.map((item) => item.label),
        {
          dataGroupId: drilldown.dataGroupId,
          data: drilldown.data,
        },
        {
          graphic: getHeaderGraphic(
            `Organizations Under ${drilldown.ministryName}`,
            true
          ),
        }
      );

      setTimeout(() => {
        chart.resize({
          height: newHeight,
        });

        chart.setOption(drilldownOption, {
          notMerge: true,
        });
      }, 0);
    };

    chart.off("click");
    chart.on("click", handleChartClick);

    chart.setOption(rootOption, {
      notMerge: true,
    });

    return () => {
      chart.off("click");
      chart.dispose();
      chartInstanceRef.current = null;
    };
  }, [isLoading, ministries, rootChartHeight]);

  useEffect(() => {
    if (!chartInstanceRef.current) return;

    chartInstanceRef.current.resize({
      height: chartHeight,
    });
  }, [chartHeight]);

  useEffect(() => {
    const handleResize = () => chartInstanceRef.current?.resize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        overflowY: "auto",
      }}
    >
      <div
        ref={chartRef}
        className={className}
        style={{
          width: "100%",
          height: `${chartHeight}px`,
        }}
      />
    </div>
  );
}
