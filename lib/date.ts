export function getTimeString(time: Date): string {
    const hours = time.getHours()
    const minutes = time.getMinutes()

    return `${(hours % 12).toString()}:${minutes
        .toString()
        .padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
}

export function getDateString(time: Date, {today = true}: { today?: boolean } = {}): string {
    const str = `${time.getDate()}/${time.getMonth() + 1}/${time.getFullYear()}`

    if (today && str === getDateString(new Date(Date.now()), {today: false})) return 'Today'
    return str
}
