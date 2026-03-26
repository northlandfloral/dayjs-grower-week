const growerWeek = (option, dayjsClass, dayjsFactory) => {
  const weekDecidingDay = 4 // Thursday
  
  const getYearFirst = (year, isUtc) => {
    const yearFirstDay = (isUtc ? dayjsFactory.utc : dayjsFactory)().year(year).startOf('year')
    let addDiffDays = weekDecidingDay - yearFirstDay.day()
    if (yearFirstDay.day() > weekDecidingDay) {
      addDiffDays += 7
    }
    return yearFirstDay.add(addDiffDays, 'day')
  }

  // gets the current week deciding day 
  const getCurrentWeekDecidingDay = (curDay) => {
    return curDay.add((weekDecidingDay - curDay.day()), 'day')
  }

  dayjsClass.prototype.growerWeek = function(week) {
    // handle setting grower week
    if (week !== undefined) {
      return this.add((week - this.growerWeek()) * 7, 'day')
    }
      
    const nowWeek = getCurrentWeekDecidingDay(this)
    const diffWeek = getYearFirst(this.growerWeekYear(), this.$u)
    return nowWeek.diff(diffWeek, 'week') + 1
  }

  dayjsClass.prototype.growerWeekYear = function() {
    const nowWeek = getCurrentWeekDecidingDay(this)  
    return nowWeek.year()
  }

  const oldStartOf = dayjsClass.prototype.startOf
  dayjsClass.prototype.startOf = function(units, startOf) {
    const utils = this.$utils()
    const isStartOf = !utils.u(startOf) ? startOf : true
    const unit = utils.p(units)
    if (unit === 'growerweek') {
      if (isStartOf)
        return this.date(this.date() - this.day()).startOf('day') 

      return this.date((this.date() - 1 - this.day()) + 7).endOf('day')
    }
    return oldStartOf.bind(this)(units, startOf)
  }

  const oldFormat = dayjsClass.prototype.format
  dayjsClass.prototype.format = function(formatStr) {
   
    if (!this.isValid()) {
      return oldFormat.bind(this)(formatStr)
    }
    const utils = this.$utils()
    const str = formatStr || FORMAT_DEFAULT
    
    const result = str.replace(/\[([^\]]+)]|gww|gw|gy|S/g, (match) => {
      switch (match) {
        case 'gw':
        case 'gww':
          return utils.s(this.growerWeek(), match === 'gw' ? 1 : 2, '0')
        case 'gy':
          return this.growerWeekYear()
        default:
          return match
      }
    })

    return oldFormat.bind(this)(result)
  }

  const oldParse = dayjsClass.prototype.parse;
  dayjsClass.prototype.parse = function(cfg) {
    const { date, args } = cfg;

    if (args?.[1] === 'gygww') {
      const dateStr = date.toString();
      const year = parseInt(dateStr.substring(0, 4));
      const week = parseInt(dateStr.substring(4, 6));
      
      // 1. Get the anchor day (Thursday) of the first week
      let firstWeekAnchor = getYearFirst(year, this.$u);
      
      // 2. Snap to the Sunday of that first week
      // Since dayjs().day(0) gets Sunday of the current week:
      let week1Sunday = firstWeekAnchor.startOf('day').subtract(firstWeekAnchor.day(), 'days');
      
      // 3. Add the number of weeks (Week 11 means adding 10 weeks to Week 1)
      this.$d = week1Sunday.add(week - 1, 'weeks').toDate();
      this.init();
    } else {
      oldParse.call(this, cfg);
    }
  }

  dayjsClass.prototype.growerWeeksInYear = function() {
    const isLeapYear = this.isLeapYear()
    const last = this.endOf('year')
    const day = last.day()
    if (day === 4 || (isLeapYear && day === 5)) {
      return 53
    }
    return 52
  }
}

export { growerWeek };
export default growerWeek;