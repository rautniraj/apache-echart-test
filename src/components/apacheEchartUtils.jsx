export const yAxisLabelWidth = 250;
export const yAxisMaxLineLength = 35;
export const chartGrid = {
  left: 250,
  right: 50,
  top: 104,
  bottom: 20,
  containLabel: false,
};
export const chartFontFamily = "Arial, sans-serif";
export const rowHeight = 75;
export const minHeight = 500;

export function formatTextLinesByWords(value, maxLineLength) {
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
}

export function formatTextByWords(value, maxLineLength) {
  return formatTextLinesByWords(value, maxLineLength).join("\n");
}

export function formatTextByWordsForHtml(value, maxLineLength) {
  return formatTextLinesByWords(value, maxLineLength).join("<br />");
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatAxisLabel(value) {
  return formatTextByWords(value, yAxisMaxLineLength);
}

export function formatCompactNumber(value) {
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
}

export function getTooltipFormatter(params) {
  const item = params.data;

  if (!item) return "";

  const label = escapeHtml(item.label || params.name);
  const wrappedLabel = formatTextByWordsForHtml(label, 28);

  return `
    <div class="chart-tooltip" style="min-width: 200px; font-family: ${chartFontFamily};">
      <div class="chart-tooltip__title">
        ${wrappedLabel}
      </div>
      <hr class="chart-tooltip__divider" />
      <div style="display: grid; grid-template-columns: auto minmax(165px, 1fr) auto; align-items: center; gap: 7px 10px; font-size: 14px; color: #5F6368;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${params.color}; display: inline-block;"></span>
        <span>Meetings Hosted</span>
        <span style="font-weight: 700; color: #5F6368; text-align: right;">${formatCompactNumber(item.meetings_count)}</span>

        <span style="width: 10px; height: 10px; border-radius: 50%; background: #A3D329; display: inline-block;"></span>
        <span>Conference Hours</span>
        <span style="font-weight: 700; color: #5F6368; text-align: right;">${formatCompactNumber(item.duration_sum / 60)}</span>

        <span style="width: 10px; height: 10px; border-radius: 50%; background: #000; display: inline-block;"></span>
        <span>Participants Connected</span>
        <span style="font-weight: 700; color: #5F6368; text-align: right;">${formatCompactNumber(item.participants_sum)}</span>
      </div>
    </div>
  `;
}

export function getChartTitle(subtext) {
  return {
    text: "Meetings Dashboard",
    subtext,
    left: "center",
    top: 8,
    textStyle: {
      fontSize: 18,
      fontWeight: 600,
      fontFamily: chartFontFamily,
      color: "#111827",
    },
    subtextStyle: {
      fontSize: 15,
      fontWeight: 500,
      fontFamily: chartFontFamily,
      color: "#6B7280",
      lineHeight: 20,
    },
  };
}

export function getBackGraphic(onBack) {
  return {
    type: "text",
    left: 20,
    top: 18,
    z: 100,
    style: {
      text: "< Back",
      fontSize: 15,
      fontWeight: "bold",
      cursor: "pointer",
      fontFamily: chartFontFamily,
      fill: "#111827",
    },
    onclick: onBack,
  };
}

export function getNoDataGraphic() {
  return {
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
  };
}

export function getChartOption(
  yAxisData,
  seriesData,
  extraOption = {},
  enableTransition = true
) {
  return {
    tooltip: {
      trigger: "item",
      backgroundColor: "#FFFFFF",
      borderColor: "#D1D5DB",
      borderWidth: 1,
      padding: 12,
      textStyle: {
        fontFamily: chartFontFamily,
      },
      extraCssText:
        "box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12); border-radius: 10px;",
      formatter: getTooltipFormatter,
    },
    toolbox: {
      show: true,
      right: 16,
      top: 14,
      feature: {
        saveAsImage: {
          title: "Download",
          name: `meetings-dashboard-${Date.now()}`,
          type: "png",
          pixelRatio: 2,
          backgroundColor: "#FFFFFF",
        },
      },
    },
    title: getChartTitle("Top Ministries"),
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
        fontWeight: 600,
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
        enabled: enableTransition,
        divideShape: "clone",
      },
    },
    ...extraOption,
  };
}
