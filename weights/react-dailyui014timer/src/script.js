var App = React.createClass({
	getInitialState: function() {
		return this.getDate();
	},
	getDate: function() {
		var newdate = new Date();
		var date = {};

		date.hours = newdate.getHours();
		date.minutes = newdate.getMinutes();
		date.seconds = newdate.getSeconds();

		return date;
	},
	updateDate: function() {
		this.setState(this.getDate());
	},
	renderDate: function() {
		var secondOffset = (date.seconds / 60) * 100 + '%';
		var minuteOffset = (date.minutes / 60) * 100 + '%';
		var hourOffset = (date.hours / 24) * 100 + '%';

		var secondopacity = (date.seconds / 60 * 100) / 100;
		var minuteopacity = (date.minutes / 60 * 100) / 100;
		var houropacity = (date.hours / 24 * 100) / 100;
	},
	componentDidMount: function() {
		var that = this;
		setInterval(function() {
			that.updateDate();
		}, 1000);
	},
	render: function() {
		return (
			<div className="App">
				<Marker type="hours" time={this.state.hours} />
				<Marker type="minutes" time={this.state.minutes} />
				<Marker type="seconds" time={this.state.seconds} />
				<div className="text-overlay">
					<Timer type="hours" time={this.state.hours} />
					<Timer type="minutes" time={this.state.minutes} />
					<Timer type="seconds" time={this.state.seconds} />
				</div>
			</div>
		);
	}
});

var Marker = React.createClass({
	render: function() {
		switch (this.props.type) {
			case 'hours':
				var measurement = 24;
				break;
			case 'minutes':
				var measurement = 60;
				break;
			case 'seconds':
				var measurement = 60;
				break;
		}
		
		var offset = (this.props.time / measurement) * 100 + '%';
		var opacity = (this.props.time / measurement * 100) / 100;
		
		var columnClasses = 'Column Column--' + this.props.type;
		var typeClasses = 'Marker Marker--' + this.props.type;
		return (
			<div className={columnClasses}>
				<div className={typeClasses} style={{height: offset, opacity: opacity}}></div>
			</div>
		);
	}
});

var Timer = React.createClass({
	render: function() {
		if (this.props.time < 10) {
			var time = '0' + this.props.time;
		} else {
			var time = this.props.time;
		}
		return (
			<div className={this.props.type}>{time}</div>
		);
	}
});

ReactDOM.render(
	<App />,
	document.getElementById('app')
);
