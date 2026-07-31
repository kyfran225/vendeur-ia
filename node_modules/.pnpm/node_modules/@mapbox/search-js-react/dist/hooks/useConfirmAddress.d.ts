/// <reference types="react" />
import { AddressConfirmOptions, AddressConfirmShowResult } from '@mapbox/search-js-web';
interface UseConfirmAddressObject {
    formRef: React.RefObject<HTMLFormElement>;
    showConfirm: (options?: Partial<AddressConfirmOptions>) => Promise<AddressConfirmShowResult>;
}
/**
 * A React hook that returns a form ref and a function to show the address confirmation modal
 *
 * @param {AddressConfirmOptions} optionsArg
 * @see {@link confirmAddress}
 * @example
 * ```typescript
 * import { useConfirmAddress } from '@mapbox/search-js-react';
 *
 * export function Autofill(): React.ReactElement {
 *   const { formRef, showConfirm } = useConfirmAddress({
 *     footer: 'My custom footer'
 *   });
 *
 *   const handleSubmit = React.useCallback(async () => {
 *     const result = await showConfirm();
 *      console.log(result);
 *   }, [showConfirm]);
 *
 *   return (
 *     <div>
 *       <form
 *         ref={formRef}
 *         style={{ display: 'flex', flexDirection: 'column', marginTop: 30 }}
 *       >
 *         <AddressAutofill
 *           ...
 *         >
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useConfirmAddress(optionsArg?: AddressConfirmOptions): UseConfirmAddressObject;
export {};
