export function getTimeString(time: Date): string {
    return `${time.getHours().toString().padStart(2, "0")}:${time
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
}

export function getDateString(time: Date, {today = true}: { today?: boolean } = {}): string {
    const str = `${time.getDate()}/${time.getMonth() + 1}/${time.getFullYear()}`

    if (today && str === getDateString(new Date(Date.now()), {today: false})) return 'Today'
    return str
}
