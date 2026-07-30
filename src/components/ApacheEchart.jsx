import React, { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts";
import response from "../assets/sample.json";

export default function ApacheEchart({
    isLoading = false,
    className,
}) {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

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

        if (isLoading) {
            chart.showLoading();
            return;
        }

        chart.hideLoading();

        const rootOption = {
            grid: {
                left: 90,
                right: 50,
                top: 50,
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
                    width: 250,
                    overflow: "break",
                    lineHeight: 20,

                    formatter: value => {
                        const maxLength = 35;
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
    const newHeight = Math.max(
        minHeight,
        ministries.length * rowHeight
    );

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


            //             console.log(drilldown)
            //             console.log(drilldown.data.length);
            // console.log(drilldown.data.map(item => item[0]));
            // console.log(drilldown.data.map(item => item[1]));

            console.log("Chart Height:", chartHeight);
            console.log("Expected Height:", Math.max(minHeight, drilldown.data.length * rowHeight));

            setTimeout(() => {
                chart.resize({
                    height: newHeight,
                });

                chart.setOption(
                    {
                        grid: {
                            left: 90,
                            right: 50,
                            top: 50,
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
                                width: 250,
                                overflow: "break",
                                lineHeight: 20,

                                formatter: value => {
                                    const maxLength = 35;
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
                        notMerge: true,
                    }
                );
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
