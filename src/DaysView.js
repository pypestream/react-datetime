'use strict';

var React = require('react'),
	createClass = require('create-react-class'),
	moment = require('moment'),
	CATCHING_KEYS = require('./CatchingKeys')
	;

var DateTimePickerDays = createClass({
	getInitialState: function() {
		return {
			hasFocused: false,
			focused: this.props.selectedDate && this.props.selectedDate.clone()
				|| this.props.viewDate && this.props.viewDate.clone(),
		};
	},

	componentDidMount: function() {
		if (this.dateArea) this.dateArea.focus();
	},

	componentDidUpdate: function(prevProps) {
		var selectedDate = this.props.selectedDate,
			viewDate = this.props.viewDate,
			prevSelectedDate = prevProps.selectedDate,
			prevViewDate = prevProps.viewDate;

		if (selectedDate && !selectedDate.isSame(prevSelectedDate, 'day')) {
			this.setState({ focused: selectedDate.clone() }, this.focusDay);
		} else if (viewDate && !viewDate.isSame(prevViewDate, 'day')) {
			this.setState({ focused: viewDate.clone() });
		}
	},

	render: function() {
		var footer = this.renderFooter(),
			date = this.props.viewDate,
			locale = date.localeData(),
			self = this,
			tableChildren
		;

		tableChildren = [
			React.createElement('thead', { key: 'th' }, [
				React.createElement('tr', { key: 'd'}, this.getDaysOfWeek( locale ).map( function( day, index ) { return React.createElement('th', { key: day + index, className: 'dow'}, day ); }) )
			]),
			React.createElement('tbody', {
				key: 'tb',
				role: 'group',
				'aria-hidden': true,
				tabIndex: self.state.hasFocused ? -1 : 0,
				ref: function (ref) { self.dateArea = ref; },
				onFocus: function () {
					self.setState({ hasFocused: true });
					if (!self.state.hasFocused) self.focusDay();
				},
				onBlur: function () {
					self.setState({ hasFocused: false });
				},
				onKeyDown: this.handleKeyDown,
			}, this.renderDays())
		];

		if ( footer )
			tableChildren.push( footer );

		var headerLocaleDate = locale.months(date).slice(0, 1).toUpperCase() + locale.months(date).slice(1) + ' ' + date.year();
		return React.createElement('div', { className: 'rdtDays', role: 'application' }, [
			React.createElement('div', { key: 'header', className: 'rdtHeader' }, [
				React.createElement('div', { key: 's', className: 'rdtSwitch' }, headerLocaleDate),
				React.createElement('div', {
					key: 'p',
					role: 'button',
					tabIndex: 0,
					'aria-label': 'Next Month',
					className: 'rdtPrev',
					onClick: this.props.subtractTime(1, 'months'),
					onKeyDown: function (event) {
						if (event.key === CATCHING_KEYS.Enter || event.key === CATCHING_KEYS.Space) {
							event.preventDefault();
							self.props.subtractTime(1, 'months')();
						}
					},
				}, this.createArrowElement()),
				React.createElement('div', {
					key: 'n',
					role: 'button',
					tabIndex: 0,
					'aria-label': 'Previous Month',
					className: 'rdtNext',
					onClick: this.props.addTime(1, 'months'),
					onKeyDown: function (event) {
						if (event.key === CATCHING_KEYS.Enter || event.key === CATCHING_KEYS.Space) {
							event.preventDefault();
							self.props.addTime(1, 'months')();
						}
					},
				}, this.createArrowElement(true))
			]),
			React.createElement('table', { key: 'table', 'aria-hidden': true }, tableChildren),
		]);
	},

	createArrowElement: function(right) {
		return React.createElement('svg', {
				xmlns: 'http://www.w3.org/2000/svg',
				width: 20,
				height: 20,
				viewBox: '0 0 20 20',
				transform: 'rotate(' + (right ? 180 : 0) + ')',
			}, React.createElement('g', { fill: 'none', fillRule: 'evenodd' },
			React.createElement('path', {
				fill: '#AFBED3',
				fillRule: 'nonzero',
				d: 'M13.375 14.325L11.872 15.8 6 9.9 11.872 4l1.503 1.475L8.95 9.9z',
			}))
		);
	},

	handleKeyDown: function (event) {
		var focused = this.state.focused.clone(),
			prevFocused = focused.clone();

		switch (event.key) {
			case CATCHING_KEYS.ArrowUp:
				focused.subtract(7, 'days');
				break;

			case CATCHING_KEYS.ArrowDown:
				focused.add(7, 'days');
				break;

			case CATCHING_KEYS.ArrowLeft:
				focused.subtract(1, 'days');
				break;

			case CATCHING_KEYS.ArrowRight:
				focused.add(1, 'days');
				break;

			case CATCHING_KEYS.Space:
			case CATCHING_KEYS.Enter:
				var day = prevFocused && prevFocused.date();
				var element = this.dateArea.querySelector('td[data-value=' + '"' + day + '"]:not(.rdtOld):not(.rdtNew)');
				if (element) element.click();
				break;

			default:
				break;
		}

		if (!prevFocused.isSame(focused, 'day')) {
			if (!prevFocused.isSame(focused, 'month')) {
				(focused.isAfter(prevFocused) ?
						this.props.addTime(1, 'months') : this.props.subtractTime(1, 'months')
				)();
			}
			this.setState({ focused: focused }, this.focusDay);
		}

		if (Object.keys(CATCHING_KEYS).map(function (k) { return CATCHING_KEYS[k]; }).includes(event.key)) {
			event.preventDefault();
		}
	},

	focusDay: function () {
		var day = this.state.focused && this.state.focused.date();
		var element = this.dateArea.querySelector('td[data-value=' + '"' + day + '"]:not(.rdtOld):not(.rdtNew)');

		if (element) element.focus();
	},

	/**
	 * Get a list of the days of the week
	 * depending on the current locale
	 * @return {array} A list with the shortname of the days
	 */
	getDaysOfWeek: function( locale ) {
		var days = locale._weekdaysMin,
			first = locale.firstDayOfWeek(),
			dow = [],
			i = 0
		;

		days.forEach( function( day ) {
			dow[ (7 + ( i++ ) - first) % 7 ] = day;
		});

		return dow;
	},

	renderDays: function() {
		var date = this.props.viewDate,
			selected = this.props.selectedDate && this.props.selectedDate.clone(),
			focused = this.state.focused && this.state.focused.clone(),
			hasFocused = this.state.hasFocused,
			prevMonth = date.clone().subtract( 1, 'months' ),
			currentYear = date.year(),
			currentMonth = date.month(),
			weeks = [],
			days = [],
			renderer = this.props.renderDay || this.renderDay,
			isValid = this.props.isValidDate || this.alwaysValidDate,
			classes, isDisabled, dayProps, currentDate
		;

		// Go to the last week of the previous month
		prevMonth.date( prevMonth.daysInMonth() ).startOf( 'week' );
		var lastDay = prevMonth.clone().add( 42, 'd' );

		while ( prevMonth.isBefore( lastDay ) ) {
			classes = 'rdtDay';
			currentDate = prevMonth.clone();

			var isAccessible = true;
			var isFocused = false;
			if ( ( prevMonth.year() === currentYear && prevMonth.month() < currentMonth ) || ( prevMonth.year() < currentYear ) ) {
				isAccessible = false;
				classes += ' rdtOld';
			} else if ( ( prevMonth.year() === currentYear && prevMonth.month() > currentMonth ) || ( prevMonth.year() > currentYear ) ) {
				isAccessible = false;
				classes += ' rdtNew';
			}

			if ( selected && prevMonth.isSame( selected, 'day' ) )
				classes += ' rdtActive';

			if ( hasFocused && focused && prevMonth.isSame(focused, 'day') ) {
				isFocused = true;
				classes += ' rdtFocused';
			}

			if ( prevMonth.isSame( moment(), 'day' ) )
				classes += ' rdtToday';

			isDisabled = !isValid( currentDate, selected );
			if ( isDisabled )
				classes += ' rdtDisabled';

			dayProps = {
				key: prevMonth.format( 'M_D' ),
				'data-value': prevMonth.date(),
				className: classes
			};

			if (isAccessible) {
				dayProps.role = 'button';
				dayProps.tabIndex = isFocused ? 0 : -1;
				dayProps['aria-label'] = prevMonth.format(this.props.dateFormat);
			}

			if ( !isDisabled )
				dayProps.onClick = this.updateSelectedDate;

			days.push( renderer( dayProps, currentDate, selected ) );

			if ( days.length === 7 ) {
				weeks.push( React.createElement('tr', { key: prevMonth.format( 'M_D' )}, days ) );
				days = [];
			}

			prevMonth.add( 1, 'd' );
		}

		return weeks;
	},

	updateSelectedDate: function( event ) {
		this.props.updateSelectedDate( event, true );
	},

	renderDay: function( props, currentDate ) {
		return React.createElement('td',  props, currentDate.date() );
	},

	renderFooter: function() {
		if ( !this.props.timeFormat )
			return '';

		var date = this.props.selectedDate || this.props.viewDate;

		return React.createElement('tfoot', { key: 'tf'},
			React.createElement('tr', {},
				React.createElement('td', { onClick: this.props.showView( 'time' ), colSpan: 7, className: 'rdtTimeToggle' }, date.format( this.props.timeFormat ))
			)
		);
	},

	alwaysValidDate: function() {
		return 1;
	}
});

module.exports = DateTimePickerDays;