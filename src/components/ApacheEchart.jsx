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
        top: 50,
        bottom: 20,
        containLabel: false,
    };

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

        const formatAxisLabel = (value) => {
            const words = value.split(" ");
            const lines = [];
            let currentLine = "";

            words.forEach((word) => {
                if ((currentLine + " " + word).trim().length <= yAxisMaxLineLength) {
                    currentLine = (currentLine + " " + word).trim();
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            });

            if (currentLine) {
                lines.push(currentLine);
            }

            return lines.join("\n");
        };

        const getChartOption = (yAxisData, seriesData, extraOption = {}) => ({
            grid: chartGrid,
            xAxis: {
                type: "value",
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
                    formatter: formatAxisLabel,
                },
            },
            animationDurationUpdate: 700,
            series: {
                id: "meetings",
                type: "bar",
                colorBy: "data",
                barMaxWidth: 28,
                barCategoryGap: "30%",
                label: {
                    show: true,
                    position: "right",
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
                    graphic: [
                        {
                            type: "text",
                            left: 20,
                            top: 20,
                            style: {
                                text: "<- Back",
                                fontSize: 16,
                                fontWeight: "bold",
                                cursor: "pointer",
                            },
                            onclick: handleBack,
                        },
                    ],
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
