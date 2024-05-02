import View from "./page.client";

export default async function Page({
                                       params,
                                   }: {
    params: { channel: string };
}) {

    return <View channelId={params.channel}/>;
}
