declare module 'thirty-two' {
	export function encode(data: string | Buffer): Buffer
	export function decode(data: string): Buffer
}
