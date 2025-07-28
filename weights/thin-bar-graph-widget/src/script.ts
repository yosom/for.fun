import React, { StrictMode, useEffect, useRef, useState } from "https://esm.sh/react";
import { createRoot } from "https://esm.sh/react-dom/client";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<main>
			<WeightWidget />
		</main>
	</StrictMode>
);

function WeightWidget() {
	 // us or metric
	const system: System = "us";
	// in or cm
	const height = 70;
	// lbs or kg
	const weights = [140, 145, 147, 154, 154, 152, 153, 154, 149, 147, 148, 149, 145, 147, 147, 152, 148, 153, 147, 145, 147, 148, 145, 146, 148, 146, 144, 144, 147];
	const weightThreshold = 150;
	const bmiThreshold = calcBMI(weightThreshold, height, system);

	const dataSet: GraphData[] = [
		{
			data: weights,
			threshold: weightThreshold,
			mode: "weight",
			name: "Weight",
			ariaLabel: `Weight chart. Threshold is ${Utils.formatNumber(weightThreshold)}. ${weights.length} bars.`
		},
		{
			data: weights.map((weight) => calcBMI(weight, height, system)),
			threshold: bmiThreshold,
			mode: "bmi",
			name: "BMI",
			ariaLabel: `BMI chart. Threshold is ${Utils.formatNumber(bmiThreshold)}. ${weights.length} bars.`
		}
	];

	/**
	 * Get the BMI based on the current measurement system.
	 * @param height height in inches (in) or centimeters (cm)
	 * @param weight weight in pounds (lbs) or kilograms (kg)
	 * @param system measurement system
	 */
	function calcBMI(height: number, weight: number, system: System): number {
		const bmiFns: Record<System, (weight: number, height: number) => number> = {
			us: Utils.calcBMIInLbs,
			metric: Utils.calcBMIInKg
		};
		return bmiFns[system](weight, height);
	}

	return (
		<ThinBarGraph dataSet={dataSet} />
	);
}
function ThinBarGraph({ dataSet }: ThinBarGraphProps) {
	const [mode, setMode] = useState(dataSet[0]?.mode || "");
	const dataParams = dataSet.find((item) => item.mode === mode) || {} as GraphData;
	const { data = [], threshold = 0, name = "", ariaLabel = "" } = dataParams;
	const diff = (data.at(-1) ?? 0) - threshold;

	return (
		<div className="widget">
			<div className="widget__header">
				{
					dataSet.map((item, i) => (
						<ThinBarGraphButton
							key={i}
							pressed={mode === item.mode}
							onClick={() => setMode(item.mode)}
						>
							{item.name}
						</ThinBarGraphButton>
					))
				}
				<div className="widget__diff">
					{Utils.formatNumber(diff)}
				</div>
			</div>
			<ThinBarGraphData
				data={data}
				threshold={threshold}
				name={name}
				ariaLabel={ariaLabel}
			/>
		</div>
	);
}
function ThinBarGraphButton({ children, pressed, onClick }: ThinBarGraphButtonProps) {
	return (
		<button
			className="widget__button"
			type="button"
			aria-pressed={pressed}
			onClick={onClick}
		>
			{children}
		</button>
	);
}
function ThinBarGraphData({ data, threshold, name, ariaLabel }: ThinBarGraphDataProps) {
	const animationRef = useRef(0);
	const [animating, setAnimating] = useState(false);
	const GRAPH_WIDTH = 512;
	const GRAPH_HEIGHT = 129;
	const VIEWBOX = `0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`;
	const BARS_MAX = 28;
	const BAR_WIDTH = 4;
	const PADDING_START = 55;
	const PADDING_Y = 2;
	const barsSpan = GRAPH_WIDTH - PADDING_START;
	const barSpacing = barsSpan / (BARS_MAX - 1) - BAR_WIDTH / (BARS_MAX - 1);
	const RTL = document.dir === "rtl";
	const filteredData = data.slice(-BARS_MAX);
	const minValue = Math.min(...data, threshold);
	const maxValue = Math.max(...data, threshold);
	const range = maxValue - minValue || 1;
	const plotHeight = GRAPH_HEIGHT - PADDING_Y * 2;
	const thresholdY = getY(threshold);
	const baselineY = getY(minValue);
	const labelX = RTL ? GRAPH_WIDTH : 0;
	const labelTransform = `translate(${labelX}, 0)`;
	const barsX = RTL ? 0 : PADDING_START;
	const barsTransform = `translate(${barsX}, 0)`;
	const lineColor = "currentcolor";
	const thresholdColor = "light-dark(var(--danger450), var(--danger350)";
	const graphDesc = `A vertical bar graph showing ${name} over time. Each bar represents a data point. Bars are black below the threshold of ${Utils.formatNumber(threshold)} and red above it. A red dashed horizontal line represents the threshold value.`;

	/**
	 * Get the Y position for a value from data.
	 * @param value data value
	 */
	function getY(value: number): number {
		return PADDING_Y + plotHeight * (1 - (value - minValue) / range);
	}

	useEffect(() => {
		animationRef.current = setTimeout(() => setAnimating(true), 200);

		return () => {
			clearTimeout(animationRef.current);
		};
	}, []);

	return <>
		<svg
			className="widget__graph"
			role="img"
			aria-label={ariaLabel}
			viewBox={VIEWBOX}
			width={GRAPH_WIDTH}
			height={GRAPH_HEIGHT}
		>
			<desc>{graphDesc}</desc>
			<g fontSize="18" textAnchor="start" transform={labelTransform}>
				<text y={thresholdY} fill={thresholdColor}>
					{Utils.formatNumber(threshold)}
				</text>
				<text y={baselineY} fill={lineColor}>
					{Utils.formatNumber(minValue)}
				</text>
			</g>
			<g transform={barsTransform}>
				<line
					x1="0"
					x2={barsSpan}
					y1={thresholdY}
					y2={thresholdY}
					stroke={thresholdColor}
					strokeDasharray="4 4"
					strokeWidth="1"
				/>
				<g strokeWidth={BAR_WIDTH}>
					{filteredData.map((value, i) => {
						let x = (BAR_WIDTH / 2) + i * barSpacing;

						if (RTL) x = barsSpan - x;

						const isAbove = value > threshold;
						const topY = getY(value);
						const bottomY = Math.max(topY, thresholdY);
						const topLength = thresholdY - topY;
						const bottomLength = baselineY - thresholdY;
						const lineLength = topLength + bottomLength;
						const strokeDasharray = `${lineLength} ${lineLength}`;
						const topStrokeDashoffset = animating ? bottomLength : lineLength + bottomLength;
						const bottomStrokeDashoffset = animating ? 0 : lineLength;

						return (
							<g key={i}>
								{isAbove && (
									<line
										x1={x}
										x2={x}
										y1={thresholdY}
										y2={topY}
										stroke={thresholdColor}
										strokeDasharray={strokeDasharray}
										strokeDashoffset={topStrokeDashoffset}
									/>
								)}
								<line
									x1={x}
									x2={x}
									y1={baselineY}
									y2={bottomY}
									stroke={lineColor}
									strokeDasharray={strokeDasharray}
									strokeDashoffset={bottomStrokeDashoffset}
								/>
								<title>{Utils.formatNumber(value)}</title>
							</g>
						);
					})}
				</g>
			</g>
		</svg>
		<ul className="widget__sr-only">
			{filteredData.map((value, i) => {
				const position = value > threshold ? "above" : "below";
				const liText = `${Utils.formatNumber(value)}, ${position} threshold`;

				return (
					<li key={i}>{liText}</li>
				);
			})}
		</ul>
	</>;
}

class Utils {
	static LOCALE = "en-US";
	/**
	 * Get the BMI for metric units.
	 * @param height height in centimeters (cm)
	 * @param weight weight in kilograms (kg)
	 */
	static calcBMIInKg(height: number, weight: number): number {
		return weight / (height ** 2);
	}
	/**
	 * Get the BMI for US units.
	 * @param height height in inches (in)
	 * @param weight weight in pounds (lbs)
	 */
	static calcBMIInLbs(height: number, weight: number): number {
		return (weight * 703) / (height ** 2);
	}
	/**
	 * Format any kind of number to a localized format.
	 * @param n number
	 * @param decimalPlaces max number of decimal places
	 */
	static formatNumber(n: number, decimalPlaces: number = 1) {
		return new Intl.NumberFormat(this.LOCALE, {
			maximumFractionDigits: decimalPlaces
		}).format(n);
	}
}

// interfaces
interface ThinBarGraphProps {
	dataSet: GraphData[];
};
interface ThinBarGraphButtonProps {
	children?: React.ReactNode;
	pressed?: boolean;
	onClick?: () => void;
};
interface ThinBarGraphDataProps {
	data: number[];
	threshold: number;
	name: string;
	ariaLabel: string;
};
interface GraphData extends ThinBarGraphDataProps {
	mode: string;
};

// types
type System = "us" | "metric";