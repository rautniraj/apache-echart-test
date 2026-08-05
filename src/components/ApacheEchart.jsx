import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import {
  getBackGraphic,
  getChartOption,
  getChartTitle,
  getNoDataGraphic,
  minHeight,
  rowHeight,
} from "./apacheEchartUtils.jsx";

export default function ApacheEchart({
  isLoading,
  className,
  ministryUsage,
  period,
}) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const chartUpdateTimerRef = useRef(null);
  const currentChartHeightRef = useRef(null);
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
    if (!chartRef.current || chartInstanceRef.current) return;

    chartInstanceRef.current = echarts.init(chartRef.current);

    return () => {
      if (chartUpdateTimerRef.current) {
        window.clearTimeout(chartUpdateTimerRef.current);
        chartUpdateTimerRef.current = null;
      }

      chartInstanceRef.current?.off("click");
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
      currentChartHeightRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const setChartOption = (currentChart, option) => {
      currentChart.dispatchAction({
        type: "hideTip",
      });
      currentChart.setOption(option, {
        replaceMerge: ["graphic"],
      });
    };

    const queueChartUpdate = (callback) => {
      if (chartUpdateTimerRef.current) {
        window.clearTimeout(chartUpdateTimerRef.current);
      }

      chartUpdateTimerRef.current = window.setTimeout(() => {
        chartUpdateTimerRef.current = null;

        if (!chartInstanceRef.current || chartInstanceRef.current.isDisposed()) {
          return;
        }

        callback(chartInstanceRef.current);
      }, 0);
    };

    const resizeChartIfNeeded = (currentChart, newHeight) => {
      if (currentChartHeightRef.current === newHeight) return;

      currentChart.resize({
        height: newHeight,
      });
      currentChartHeightRef.current = newHeight;
    };

    if (isLoading) {
      chart.showLoading("default", {
        maskColor: "rgba(255, 255, 255, 0)",
      });
      return;
    }

    chart.hideLoading();

    if (ministries.length === 0) {
      chart.off("click");
      setChartOption(
        chart,
        getChartOption(
          [],
          {
            data: [],
          },
          {
            graphic: [getNoDataGraphic()],
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
        title: getChartTitle("Top Ministries"),
        graphic: [],
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

      queueChartUpdate((currentChart) => {
        resizeChartIfNeeded(currentChart, newHeight);
        setChartOption(currentChart, rootOption);
      });
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
          title: getChartTitle(`Organizations - ${drilldown.ministryName}`),
          graphic: [getBackGraphic(handleBack)],
        },
        false
      );

      queueChartUpdate((currentChart) => {
        resizeChartIfNeeded(currentChart, newHeight);
        setChartOption(currentChart, drilldownOption);
      });
    };

    chart.off("click");
    chart.on("click", handleChartClick);

    setChartOption(chart, rootOption);

    return () => {
      if (chartUpdateTimerRef.current) {
        window.clearTimeout(chartUpdateTimerRef.current);
        chartUpdateTimerRef.current = null;
      }

      chart.off("click");
    };
  }, [isLoading, ministries, rootChartHeight]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || currentChartHeightRef.current === chartHeight) return;

    chart.resize({
      height: chartHeight,
    });
    currentChartHeightRef.current = chartHeight;
  }, [chartHeight]);

  useEffect(() => {
    const handleResize = () => chartInstanceRef.current?.resize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="chart-shell w-100 d-flex flex-column">
      <div
        ref={chartRef}
        className={`chart-canvas flex-grow-1 w-100 ${className ?? ""}`.trim()}
        style={{
          "--chart-height": `${chartHeight}px`,
        }}
      />
      {period && (
        <div className="mt-4 px-3 pb-1 text-center text-muted small fw-bold">
          * Data as of {period}
        </div>
      )}
    </div>
  );
}
