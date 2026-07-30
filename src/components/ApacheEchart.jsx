import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";
import response from "../assets/sample.json";

export default function ApacheEchart({
    isLoading = false,
    className,
}) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const ministries = React.useMemo(
        () => [...response.data.data],
        []
    );

    useEffect(() => {
        if (!chartInstanceRef.current) {
            chartInstanceRef.current = echarts.init(chartRef.current);
        }

        const chart = chartInstanceRef.current;

        if (isLoading) {
            chart.showLoading();
            return;
        }

        chart.hideLoading();

        const rootOption = {
            grid: {
                left: 100,
                right: 40,
                top: 30,
                bottom: 20,
                containLabel: true,
            },

            xAxis: {
                type: "value",
            },

            yAxis: {
                type: "category",
                inverse: true,
                data: ministries.map((ministry) => ministry.ministry_name),
                axisTick: {
                    show: false,
                },
                axisLabel: {
                    width: 350,
                    lineHeight: 18,

                    formatter: value => {
                        const maxLength = 28;
                        const words = value.split(" ");

                        let lines = [];
                        let currentLine = "";

                        words.forEach(word => {
                            if ((currentLine + " " + word).trim().length <= maxLength) {
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
                    }
                }
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

                data: ministries.map((ministry) => ({
                    value: ministry.meetings_count,
                    groupId: ministry.ministry_id.toString(),
                })),

                universalTransition: {
                    enabled: true,
                    divideShape: "clone",
                },
            },
        };

        const drilldownData = ministries.map((ministry) => ({
            dataGroupId: ministry.ministry_id.toString(),
            data: ministry.organizations.map((organization) => [
                organization.organization_name,
                organization.meetings_count,
            ]),
        }));

        const handleBack = () => {
            chart.setOption(rootOption, {
                notMerge: true,
            });
        };

        const handleChartClick = (event) => {
            if (!event.data) return;

            const drilldown = drilldownData.find(
                (item) => item.dataGroupId === event.data.groupId
            );

            if (!drilldown) return;

            chart.setOption(
                {
                    grid: {
                        left: 75,
                        right: 40,
                        top: 60,
                        bottom: 20,
                        containLabel: true,
                    },

                    xAxis: {
                        type: "value",
                    },

                    yAxis: {
                        type: "category",
                        inverse: true,
                        data: drilldown.data.map((item) => item[0]),
                        axisTick: {
                            show: false,
                        },
                        axisLabel: {
                            width: 240,
                            lineHeight: 18,

                            formatter: value => {
                                const maxLength = 28;
                                const words = value.split(" ");

                                let lines = [];
                                let currentLine = "";

                                words.forEach(word => {
                                    if ((currentLine + " " + word).trim().length <= maxLength) {
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
                            }
                        }
                    },

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

                        dataGroupId: drilldown.dataGroupId,

                        data: drilldown.data.map((item) => item[1]),

                        universalTransition: {
                            enabled: true,
                            divideShape: "clone",
                        },
                    },

                    graphic: [
                        {
                            type: "text",
                            left: 20,
                            top: 20,
                            style: {
                                text: "← Back",
                                fontSize: 16,
                                fontWeight: "bold",
                                cursor: "pointer",
                            },
                            onclick: handleBack,
                        },
                    ],
                },
                {
                    replaceMerge: [
                        "grid",
                        "xAxis",
                        "yAxis",
                        "series",
                        "graphic",
                    ],
                }
            );
        };

        chart.off("click");
        chart.on("click", handleChartClick);

        chart.setOption(rootOption, {
            notMerge: true,
        });

        chart.resize();

        return () => {
            chart.off("click");
            chart.dispose();
            chartInstanceRef.current = null;
        };
    }, [isLoading, ministries]);

    useEffect(() => {
        const handleResize = () => chartInstanceRef.current?.resize();

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div
            ref={chartRef}
            className={className}
            style={{
                width: "100%",
                height: "500px",
            }}
        />
    );
}