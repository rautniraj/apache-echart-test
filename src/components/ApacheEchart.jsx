import React, { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
// import response from "../assets/sample_8.json";
import response from "../assets/sample_all.json";

export default function ApacheEchart({
    isLoading = false,
    className,
}) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const yAxisLabelWidth = 250;
    const yAxisMaxLineLength = 35;
    const chartGrid = {
        left: 300,
        right: 50,
        top: 104,
        bottom: 20,
        containLabel: false,
    };
    const chartFontFamily = "Arial, sans-serif";
    const chartTitleMaxLineLength = 75;

    const ministries = useMemo(
        () => [...response.data.data],
        []
    );

    const rowHeight = 75;
    const minHeight = 500;
    const [chartHeight, setChartHeight] = useState(minHeight);

    useEffect(() => {
        setChartHeight(Math.max(minHeight, ministries.length * rowHeight));
    }, [ministries]);

    useEffect(() => {
        if (!chartInstanceRef.current) {
            chartInstanceRef.current = echarts.init(chartRef.current);
        }

        const chart = chartInstanceRef.current;

        const formatTextLinesByWords = (value, maxLineLength) => {
            const words = value.split(" ");
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
                        text: "<- Back",
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

        const getChartOption = (yAxisData, seriesData, extraOption = {}) => ({
            grid: chartGrid,
            xAxis: {
                type: "value",
                axisLabel: {
                    fontFamily: chartFontFamily,
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

        const rootOption = getChartOption(
            ministries.map((ministry) => ministry.ministry_name),
            {
                data: ministries.map((ministry) => ({
                    value: ministry.meetings_count,
                    groupId: ministry.ministry_id.toString(),
                })),
            },
            {
                graphic: getHeaderGraphic("Meetings by Ministry"),
            }
        );

        const drilldownData = ministries.map((ministry) => ({
            dataGroupId: ministry.ministry_id.toString(),
            data: ministry.organizations.map((organization) => [
                organization.organization_name,
                organization.meetings_count,
            ]),
        }));

        const handleBack = () => {
            const newHeight = Math.max(minHeight, ministries.length * rowHeight);

            setChartHeight(newHeight);

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

            setChartHeight(newHeight);

            const drilldownOption = getChartOption(
                drilldown.data.map((item) => item[0]),
                {
                    dataGroupId: drilldown.dataGroupId,
                    data: drilldown.data.map((item) => item[1]),
                },
                {
                    graphic: getHeaderGraphic(
                        `Organizations Under ${
                            ministries.find(
                                (ministry) => ministry.ministry_id.toString() === drilldown.dataGroupId
                            )?.ministry_name || ""
                        }`,
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
    }, [isLoading, ministries]);

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
